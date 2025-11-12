import { prisma } from '../config/prisma';
import { enrollmentQueue } from '../config/queue';
import { EnrollmentStatus, Prisma } from '@prisma/client';
import { ValidationError } from '../utils/errors';

/**
 * Enrollment Service with Concurrency Control
 * Implements queue-based enrollment with optimistic locking to prevent race conditions
 */

export interface EnrollmentJobData {
  userId: number;
  courseId: number;
  timestamp: Date;
}

/**
 * Queue an enrollment request
 * This prevents direct database writes and ensures sequential processing
 */
export async function queueEnrollment(userId: number, courseId: number) {
  // Check if user already has an enrollment for this course
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId
      }
    }
  });

  if (existingEnrollment) {
    if (existingEnrollment.status === EnrollmentStatus.CONFIRMED) {
      throw new ValidationError('You are already enrolled in this course');
    }
    if (existingEnrollment.status === EnrollmentStatus.PENDING) {
      throw new ValidationError('You already have a pending enrollment request for this course');
    }
    if (existingEnrollment.status === EnrollmentStatus.WAITLISTED) {
      throw new ValidationError('You are already on the waitlist for this course');
    }
  }

  // Check course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, courseCode: true, courseName: true, status: true }
  });

  if (!course) {
    throw new ValidationError('Course not found');
  }

  if (course.status === 'INACTIVE') {
    throw new ValidationError('This course is not available for enrollment');
  }

  // Add to queue
  const job = await enrollmentQueue.add(
    {
      userId,
      courseId,
      timestamp: new Date()
    },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: false, // Keep job data for status checking
      removeOnFail: false
    }
  );

  return {
    jobId: job.id,
    message: 'Enrollment request queued successfully',
    estimatedWaitTime: await estimateWaitTime()
  };
}

/**
 * Process enrollment (called by worker)
 * Implements the core enrollment logic with all business rules
 */
export async function processEnrollment(userId: number, courseId: number) {
  return await prisma.$transaction(async (tx) => {
    // 1. Lock and fetch the course with current version
    const course = await tx.course.findUnique({
      where: { id: courseId },
      include: {
        timeSlots: true,
        instructor: {
          select: {
            fullName: true
          }
        }
      }
    });

    if (!course) {
      throw new ValidationError('Course not found');
    }

    if (course.status === 'INACTIVE') {
      throw new ValidationError('Course is inactive');
    }

    // 2. Fetch user
    const user = await tx.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new ValidationError('User not found');
    }

    // 2b. Check for existing enrollment (prevents duplicate enrollments on retry)
    const existingEnrollment = await tx.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === EnrollmentStatus.CONFIRMED) {
        throw new ValidationError('You are already enrolled in this course');
      }
      if (existingEnrollment.status === EnrollmentStatus.PENDING) {
        throw new ValidationError('You already have a pending enrollment request for this course');
      }
      if (existingEnrollment.status === EnrollmentStatus.WAITLISTED) {
        throw new ValidationError('You are already on the waitlist for this course');
      }
      if (existingEnrollment.status === EnrollmentStatus.REJECTED) {
        // Delete rejected enrollment so we can try again
        await tx.enrollment.delete({
          where: { id: existingEnrollment.id }
        });
      }
    }

    // 3. Check prerequisites
    if (course.prerequisites) {
      // Parse prerequisites (comma-separated course codes)
      const requiredCourses = course.prerequisites.split(',').map(c => c.trim());

      const completedCourses = await tx.enrollment.findMany({
        where: {
          userId,
          status: EnrollmentStatus.CONFIRMED,
          grade: {
            not: null
          }
        },
        include: {
          course: {
            select: {
              courseCode: true
            }
          }
        }
      });

      const completedCourseCodes = completedCourses.map(e => e.course.courseCode);

      const missingPrereqs = requiredCourses.filter(
        req => !completedCourseCodes.includes(req)
      );

      if (missingPrereqs.length > 0) {
        throw new ValidationError(`Missing prerequisites: ${missingPrereqs.join(', ')}`);
      }
    }

    // 4. Check time conflicts
    const userEnrollments = await tx.enrollment.findMany({
      where: {
        userId,
        status: EnrollmentStatus.CONFIRMED
      },
      include: {
        course: {
          include: {
            timeSlots: true
          }
        }
      }
    });

    const hasConflict = checkTimeConflict(
      userEnrollments.flatMap(e => e.course.timeSlots),
      course.timeSlots
    );

    if (hasConflict) {
      // Create rejected enrollment
      const enrollment = await tx.enrollment.create({
        data: {
          userId,
          courseId,
          status: EnrollmentStatus.REJECTED
        }
      });

      await createAuditLog(tx, userId, 'ENROLL_REJECTED', enrollment.id, {
        reason: 'Time conflict detected'
      });

      throw new ValidationError('Time conflict detected with your existing courses');
    }

    // 5. Check credit limit (optional business rule)
    const currentSemesterEnrollments = await tx.enrollment.findMany({
      where: {
        userId,
        status: EnrollmentStatus.CONFIRMED,
        course: {
          semester: course.semester,
          year: course.year
        }
      },
      include: {
        course: {
          select: {
            credits: true
          }
        }
      }
    });

    const currentCredits = currentSemesterEnrollments.reduce(
      (sum, e) => sum + e.course.credits,
      0
    );

    const maxCredits = parseInt(process.env.MAX_CREDITS_PER_SEMESTER || '18');

    if (currentCredits + course.credits > maxCredits) {
      throw new ValidationError(`Enrollment would exceed maximum credits (${maxCredits}) for this semester`);
    }

    // 6. Check capacity with optimistic locking
    if (course.currentEnrollment >= course.maxCapacity) {
      // Add to waitlist
      const waitlistCount = await tx.enrollment.count({
        where: {
          courseId,
          status: EnrollmentStatus.WAITLISTED
        }
      });

      const enrollment = await tx.enrollment.create({
        data: {
          userId,
          courseId,
          status: EnrollmentStatus.WAITLISTED,
          waitlistPosition: waitlistCount + 1
        },
        include: {
          course: {
            select: {
              courseCode: true,
              courseName: true
            }
          }
        }
      });

      await createAuditLog(tx, userId, 'WAITLISTED', enrollment.id, {
        courseId,
        waitlistPosition: enrollment.waitlistPosition
      });

      return {
        success: true,
        status: 'WAITLISTED',
        enrollment,
        message: `You have been added to the waitlist at position ${enrollment.waitlistPosition}`
      };
    }

    // 7. Enroll with version check (optimistic locking)
    const updatedCourse = await tx.course.updateMany({
      where: {
        id: courseId,
        version: course.version // Optimistic locking check
      },
      data: {
        currentEnrollment: {
          increment: 1
        },
        version: {
          increment: 1
        },
        status: course.currentEnrollment + 1 >= course.maxCapacity ? 'FULL' : course.status
      }
    });

    if (updatedCourse.count === 0) {
      // Version mismatch - concurrent modification detected
      throw new Error('Concurrent modification detected. Please retry your enrollment.');
    }

    // 8. Create confirmed enrollment
    const enrollment = await tx.enrollment.create({
      data: {
        userId,
        courseId,
        status: EnrollmentStatus.CONFIRMED
      },
      include: {
        course: {
          select: {
            courseCode: true,
            courseName: true,
            credits: true,
            instructor: {
              select: {
                fullName: true
              }
            }
          }
        }
      }
    });

    // 9. Create audit log
    await createAuditLog(tx, userId, 'ENROLL', enrollment.id, {
      courseId,
      courseCode: course.courseCode,
      status: 'CONFIRMED'
    });

    return {
      success: true,
      status: 'CONFIRMED',
      enrollment,
      message: 'Successfully enrolled in course'
    };
  }, {
    maxWait: 10000, // 10 seconds
    timeout: 30000, // 30 seconds
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable
  });
}

/**
 * Drop a course
 */
export async function dropEnrollment(enrollmentId: number, userId: number) {
  return await prisma.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.findFirst({
      where: {
        id: enrollmentId,
        userId
      },
      include: {
        course: true
      }
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    if (enrollment.status === EnrollmentStatus.DROPPED) {
      throw new Error('Course already dropped');
    }

    // Update enrollment status to DROPPED
    await tx.enrollment.update({
      where: { id: enrollmentId },
      data: { status: EnrollmentStatus.DROPPED }
    });

    // If was confirmed, decrement course enrollment and process waitlist
    if (enrollment.status === EnrollmentStatus.CONFIRMED) {
      await tx.course.update({
        where: { id: enrollment.courseId },
        data: {
          currentEnrollment: {
            decrement: 1
          },
          version: {
            increment: 1
          },
          status: 'ACTIVE' // Reopen course if it was full
        }
      });

      // Promote next waitlisted student
      await promoteFromWaitlist(tx, enrollment.courseId);
    }

    // Create audit log
    await createAuditLog(tx, userId, 'DROP', enrollmentId, {
      courseId: enrollment.courseId,
      courseCode: enrollment.course.courseCode
    });

    return {
      success: true,
      message: 'Course dropped successfully'
    };
  });
}

/**
 * Get user's enrollments
 */
export async function getUserEnrollments(userId: number) {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId,
      status: {
        in: [EnrollmentStatus.CONFIRMED, EnrollmentStatus.PENDING, EnrollmentStatus.WAITLISTED]
      }
    },
    include: {
      course: {
        include: {
          instructor: {
            select: {
              fullName: true
            }
          },
          timeSlots: true
        }
      }
    },
    orderBy: {
      enrolledAt: 'desc'
    }
  });

  return enrollments;
}

/**
 * Get enrollment job status
 */
export async function getEnrollmentJobStatus(jobId: string) {
  const job = await enrollmentQueue.getJob(jobId);

  if (!job) {
    return { status: 'not_found', message: 'Job not found' };
  }

  const state = await job.getState();
  const progress = job.progress();

  if (state === 'completed') {
    return {
      status: 'completed',
      result: job.returnvalue,
      message: 'Enrollment processed successfully'
    };
  }

  if (state === 'failed') {
    return {
      status: 'failed',
      error: job.failedReason,
      message: 'Enrollment failed'
    };
  }

  return {
    status: state,
    progress,
    message: 'Enrollment is being processed'
  };
}

/**
 * Helper: Check time conflicts
 */
function checkTimeConflict(existingSlots: any[], newSlots: any[]): boolean {
  for (const existing of existingSlots) {
    for (const newSlot of newSlots) {
      if (existing.dayOfWeek === newSlot.dayOfWeek) {
        const existingStart = timeToMinutes(existing.startTime);
        const existingEnd = timeToMinutes(existing.endTime);
        const newStart = timeToMinutes(newSlot.startTime);
        const newEnd = timeToMinutes(newSlot.endTime);

        // Check for overlap
        if (
          (newStart >= existingStart && newStart < existingEnd) ||
          (newEnd > existingStart && newEnd <= existingEnd) ||
          (newStart <= existingStart && newEnd >= existingEnd)
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Helper: Convert time string to minutes
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Helper: Promote next student from waitlist
 */
async function promoteFromWaitlist(tx: any, courseId: number) {
  const nextWaitlisted = await tx.enrollment.findFirst({
    where: {
      courseId,
      status: EnrollmentStatus.WAITLISTED
    },
    orderBy: {
      waitlistPosition: 'asc'
    }
  });

  if (nextWaitlisted) {
    // Update enrollment to confirmed
    await tx.enrollment.update({
      where: { id: nextWaitlisted.id },
      data: {
        status: EnrollmentStatus.CONFIRMED,
        waitlistPosition: null
      }
    });

    // Increment course enrollment
    await tx.course.update({
      where: { id: courseId },
      data: {
        currentEnrollment: {
          increment: 1
        },
        version: {
          increment: 1
        }
      }
    });

    // Update remaining waitlist positions
    await tx.enrollment.updateMany({
      where: {
        courseId,
        status: EnrollmentStatus.WAITLISTED
      },
      data: {
        waitlistPosition: {
          decrement: 1
        }
      }
    });

    // Create audit log
    await createAuditLog(tx, nextWaitlisted.userId, 'PROMOTED_FROM_WAITLIST', nextWaitlisted.id, {
      courseId
    });
  }
}

/**
 * Helper: Create audit log
 */
async function createAuditLog(tx: any, userId: number, action: string, entityId: number, changes: any) {
  await tx.auditLog.create({
    data: {
      userId,
      action,
      entityType: 'enrollment',
      entityId,
      changes
    }
  });
}

/**
 * Helper: Estimate wait time
 */
async function estimateWaitTime(): Promise<number> {
  const waitingCount = await enrollmentQueue.getWaitingCount();
  const activeCount = await enrollmentQueue.getActiveCount();

  // Estimate ~2 seconds per enrollment
  return (waitingCount + activeCount) * 2;
}

/**
 * Get course waitlist
 */
export async function getCourseWaitlist(courseId: number) {
  const waitlist = await prisma.enrollment.findMany({
    where: {
      courseId,
      status: EnrollmentStatus.WAITLISTED
    },
    include: {
      user: {
        select: {
          userIdentifier: true,
          fullName: true
        }
      }
    },
    orderBy: {
      waitlistPosition: 'asc'
    }
  });

  return waitlist;
}
