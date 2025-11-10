import { prisma } from '../config/prisma';
import { Prisma, Semester, CourseStatus } from '@prisma/client';

/**
 * Course Service
 * Handles course-related operations
 */

export interface CourseFilters {
  search?: string;
  department?: string;
  semester?: Semester;
  year?: number;
  credits?: number;
  status?: CourseStatus;
  availableOnly?: boolean;
}

/**
 * Get all courses with filters
 */
export async function getAllCourses(filters: CourseFilters = {}) {
  const where: Prisma.CourseWhereInput = {};

  // Build where clause
  if (filters.search) {
    where.OR = [
      { courseCode: { contains: filters.search, mode: 'insensitive' } },
      { courseName: { contains: filters.search, mode: 'insensitive' } },
      { department: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  if (filters.department) {
    where.department = filters.department;
  }

  if (filters.semester) {
    where.semester = filters.semester;
  }

  if (filters.year) {
    where.year = filters.year;
  }

  if (filters.credits) {
    where.credits = filters.credits;
  }

  if (filters.status) {
    where.status = filters.status;
  } else {
    where.status = { in: [CourseStatus.ACTIVE, CourseStatus.FULL] };
  }

  if (filters.availableOnly) {
    where.currentEnrollment = { lt: prisma.course.fields.maxCapacity };
  }

  const courses = await prisma.course.findMany({
    where,
    include: {
      instructor: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      },
      timeSlots: true,
      _count: {
        select: {
          enrollments: {
            where: {
              status: 'CONFIRMED'
            }
          }
        }
      }
    },
    orderBy: [
      { department: 'asc' },
      { courseCode: 'asc' }
    ]
  });

  return courses;
}

/**
 * Get course by ID
 */
export async function getCourseById(id: number) {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      instructor: {
        select: {
          id: true,
          fullName: true,
          email: true,
          department: true
        }
      },
      timeSlots: true,
      enrollments: {
        where: {
          status: 'CONFIRMED'
        },
        select: {
          id: true,
          status: true,
          enrolledAt: true,
          user: {
            select: {
              userIdentifier: true,
              fullName: true
            }
          }
        }
      }
    }
  });

  if (!course) {
    throw new Error('Course not found');
  }

  return course;
}

/**
 * Search courses
 */
export async function searchCourses(query: string) {
  const courses = await prisma.course.findMany({
    where: {
      OR: [
        { courseCode: { contains: query, mode: 'insensitive' } },
        { courseName: { contains: query, mode: 'insensitive' } },
        { department: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ],
      status: { in: [CourseStatus.ACTIVE, CourseStatus.FULL] }
    },
    include: {
      instructor: {
        select: {
          fullName: true
        }
      },
      timeSlots: true
    },
    take: 50
  });

  return courses;
}

/**
 * Get departments
 */
export async function getDepartments() {
  const departments = await prisma.course.findMany({
    select: {
      department: true
    },
    distinct: ['department'],
    orderBy: {
      department: 'asc'
    }
  });

  return departments.map(d => d.department);
}

/**
 * Create course (admin only)
 */
export async function createCourse(data: any) {
  const course = await prisma.course.create({
    data: {
      courseCode: data.courseCode,
      courseName: data.courseName,
      department: data.department,
      credits: data.credits,
      maxCapacity: data.maxCapacity,
      description: data.description,
      prerequisites: data.prerequisites,
      semester: data.semester,
      year: data.year,
      status: data.status || CourseStatus.ACTIVE,
      instructorId: data.instructorId,
      timeSlots: data.timeSlots ? {
        create: data.timeSlots
      } : undefined
    },
    include: {
      instructor: {
        select: {
          fullName: true
        }
      },
      timeSlots: true
    }
  });

  return course;
}

/**
 * Update course (admin only)
 */
export async function updateCourse(id: number, data: any) {
  const course = await prisma.course.update({
    where: { id },
    data: {
      courseCode: data.courseCode,
      courseName: data.courseName,
      department: data.department,
      credits: data.credits,
      maxCapacity: data.maxCapacity,
      description: data.description,
      prerequisites: data.prerequisites,
      semester: data.semester,
      year: data.year,
      status: data.status,
      instructorId: data.instructorId
    },
    include: {
      instructor: {
        select: {
          fullName: true
        }
      },
      timeSlots: true
    }
  });

  return course;
}

/**
 * Delete course (admin only)
 */
export async function deleteCourse(id: number) {
  // Check if course has enrollments
  const enrollmentCount = await prisma.enrollment.count({
    where: {
      courseId: id,
      status: { in: ['CONFIRMED', 'WAITLISTED'] }
    }
  });

  if (enrollmentCount > 0) {
    throw new Error('Cannot delete course with active enrollments');
  }

  await prisma.course.delete({
    where: { id }
  });

  return { success: true };
}
