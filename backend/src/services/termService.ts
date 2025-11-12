import { prisma } from '../config/prisma';
import { TermStatus } from '@prisma/client';

/**
 * Term Service
 * Business logic for managing academic terms
 */

/**
 * Get all terms
 */
export async function getAllTerms() {
  const terms = await prisma.term.findMany({
    orderBy: [
      { academicYear: 'desc' },
      { type: 'asc' },
    ],
    include: {
      _count: {
        select: {
          courses: true,
          enrollments: true,
        },
      },
    },
  });

  return terms;
}

/**
 * Get active term (current enrollment period)
 */
export async function getActiveTerm() {
  const now = new Date();

  // First try to find term in enrollment period
  const enrollmentTerm = await prisma.term.findFirst({
    where: {
      status: TermStatus.ENROLLMENT,
      enrollmentStart: { lte: now },
      enrollmentEnd: { gte: now },
    },
    include: {
      _count: {
        select: {
          courses: true,
          enrollments: true,
        },
      },
    },
  });

  if (enrollmentTerm) {
    return enrollmentTerm;
  }

  // Otherwise return the term with ENROLLMENT status
  const activeTerm = await prisma.term.findFirst({
    where: {
      status: TermStatus.ENROLLMENT,
    },
    orderBy: {
      termStart: 'asc',
    },
    include: {
      _count: {
        select: {
          courses: true,
          enrollments: true,
        },
      },
    },
  });

  return activeTerm;
}

/**
 * Get term by ID
 */
export async function getTermById(termId: number) {
  const term = await prisma.term.findUnique({
    where: { id: termId },
    include: {
      _count: {
        select: {
          courses: true,
          enrollments: true,
        },
      },
    },
  });

  if (!term) {
    throw new Error('Term not found');
  }

  return term;
}

/**
 * Get term by code
 */
export async function getTermByCode(code: string) {
  const term = await prisma.term.findUnique({
    where: { code },
    include: {
      _count: {
        select: {
          courses: true,
          enrollments: true,
        },
      },
    },
  });

  if (!term) {
    throw new Error('Term not found');
  }

  return term;
}

/**
 * Get courses for a specific term
 */
export async function getTermCourses(termId: number) {
  const courses = await prisma.course.findMany({
    where: { termId },
    include: {
      instructor: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      timeSlots: true,
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
    orderBy: {
      courseCode: 'asc',
    },
  });

  return courses;
}
