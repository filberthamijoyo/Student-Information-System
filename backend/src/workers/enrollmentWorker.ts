import { Job } from 'bull';
import { enrollmentQueue } from '../config/queue';
import { pool, getClient } from '../config/database';
import { EnrollmentQueueJobData } from '../types/enrollment.types';
import { validateEnrollment } from '../utils/conflictDetection';
import { deleteCached, CACHE_KEYS } from '../config/redis';

/**
 * Process enrollment job
 * Handles the actual enrollment logic with validation and conflict checking
 */
const processEnrollment = async (job: Job<EnrollmentQueueJobData>): Promise<any> => {
  const client = await getClient();

  try {
    const { student_id, course_id, enrollment_id, attempt } = job.data;

    console.log(`Processing enrollment job ${job.id}:`, {
      student_id,
      course_id,
      enrollment_id,
      attempt,
    });

    await client.query('BEGIN');

    // Validate enrollment
    const validation = await validateEnrollment(student_id, course_id);

    if (!validation.valid) {
      console.error(`Enrollment validation failed:`, validation.conflicts);

      // Update enrollment status to failed/dropped
      await client.query(
        `UPDATE enrollments
         SET status = 'dropped', updated_at = NOW()
         WHERE id = $1`,
        [enrollment_id]
      );

      await client.query('COMMIT');

      return {
        success: false,
        message: 'Enrollment validation failed',
        conflicts: validation.conflicts,
      };
    }

    // Lock the course row to prevent race conditions
    const courseResult = await client.query(
      `SELECT id, course_code, current_enrollment, max_enrollment, status
       FROM courses
       WHERE id = $1
       FOR UPDATE`,
      [course_id]
    );

    if (courseResult.rows.length === 0) {
      throw new Error('Course not found');
    }

    const course = courseResult.rows[0];

    if (course.status !== 'active') {
      throw new Error('Course is not active');
    }

    // Check if course is full
    if (course.current_enrollment >= course.max_enrollment) {
      // Update to waitlisted
      await client.query(
        `UPDATE enrollments
         SET status = 'waitlisted',
             waitlist_position = (
               SELECT COUNT(*) + 1
               FROM enrollments
               WHERE course_id = $1 AND status = 'waitlisted'
             ),
             updated_at = NOW()
         WHERE id = $2`,
        [course_id, enrollment_id]
      );

      await client.query('COMMIT');

      console.log(`Student ${student_id} added to waitlist for course ${course_id}`);

      return {
        success: true,
        message: 'Added to waitlist',
        status: 'waitlisted',
      };
    }

    // Enroll student
    await client.query(
      `UPDATE enrollments
       SET status = 'enrolled', updated_at = NOW()
       WHERE id = $1`,
      [enrollment_id]
    );

    // Increment course enrollment count
    await client.query(
      `UPDATE courses
       SET current_enrollment = current_enrollment + 1, updated_at = NOW()
       WHERE id = $1`,
      [course_id]
    );

    await client.query('COMMIT');

    // Invalidate relevant caches
    await deleteCached(`${CACHE_KEYS.COURSE}${course_id}`);
    await deleteCached(`${CACHE_KEYS.ENROLLMENT}${student_id}`);

    console.log(`✓ Student ${student_id} successfully enrolled in course ${course_id}`);

    // TODO: Send notification to student (email/push notification)

    return {
      success: true,
      message: 'Successfully enrolled',
      status: 'enrolled',
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing enrollment:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Process waitlist when a student drops a course
 * Automatically enrolls the next student in the waitlist
 */
export const processWaitlist = async (courseId: number): Promise<void> => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Get next student in waitlist
    const waitlistResult = await client.query(
      `SELECT id, student_id
       FROM enrollments
       WHERE course_id = $1 AND status = 'waitlisted'
       ORDER BY waitlist_position ASC, enrolled_at ASC
       LIMIT 1
       FOR UPDATE`,
      [courseId]
    );

    if (waitlistResult.rows.length === 0) {
      await client.query('COMMIT');
      return; // No one in waitlist
    }

    const nextEnrollment = waitlistResult.rows[0];

    // Validate the enrollment
    const validation = await validateEnrollment(nextEnrollment.student_id, courseId);

    if (!validation.valid) {
      console.log(`Waitlist student ${nextEnrollment.student_id} is no longer eligible`);

      // Remove from waitlist
      await client.query(
        `UPDATE enrollments
         SET status = 'dropped', updated_at = NOW()
         WHERE id = $1`,
        [nextEnrollment.id]
      );

      await client.query('COMMIT');

      // Try next student in waitlist
      client.release();
      await processWaitlist(courseId);
      return;
    }

    // Enroll student from waitlist
    await client.query(
      `UPDATE enrollments
       SET status = 'enrolled', waitlist_position = NULL, updated_at = NOW()
       WHERE id = $1`,
      [nextEnrollment.id]
    );

    // Increment course enrollment
    await client.query(
      `UPDATE courses
       SET current_enrollment = current_enrollment + 1, updated_at = NOW()
       WHERE id = $1`,
      [courseId]
    );

    // Update waitlist positions for remaining students
    await client.query(
      `UPDATE enrollments
       SET waitlist_position = waitlist_position - 1, updated_at = NOW()
       WHERE course_id = $1 AND status = 'waitlisted'`,
      [courseId]
    );

    await client.query('COMMIT');

    console.log(`✓ Student ${nextEnrollment.student_id} enrolled from waitlist for course ${courseId}`);

    // TODO: Send notification to student
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing waitlist:', error);
  } finally {
    client.release();
  }
};

/**
 * Setup enrollment queue processor
 */
export const setupEnrollmentWorker = () => {
  enrollmentQueue.process(async (job: Job<EnrollmentQueueJobData>) => {
    return await processEnrollment(job);
  });

  console.log('✓ Enrollment worker started');
};

/**
 * Graceful shutdown
 */
export const shutdownWorker = async () => {
  console.log('Shutting down enrollment worker...');
  await enrollmentQueue.close();
  console.log('✓ Enrollment worker shut down');
};

// Handle process termination
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received');
  await shutdownWorker();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received');
  await shutdownWorker();
  process.exit(0);
});

// Start worker if this file is run directly
if (require.main === module) {
  setupEnrollmentWorker();
  console.log('Enrollment worker is running...');
}

export default setupEnrollmentWorker;
