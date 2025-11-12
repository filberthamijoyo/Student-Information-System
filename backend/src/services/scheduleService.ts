import { prisma } from '../config/prisma';
import { DayOfWeek, TimeSlot } from '@prisma/client';

/**
 * Schedule Service
 * Business logic for viewing and managing weekly schedules
 */

interface WeeklyScheduleItem {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  location: string | null;
  course: {
    id: number;
    courseCode: string;
    courseName: string;
    credits: number;
    instructor: {
      id: number;
      fullName: string;
    } | null;
  };
  enrollmentStatus?: string;
}

/**
 * Get user's weekly schedule (all enrolled courses)
 */
export async function getUserWeeklySchedule(userId: number, termId?: number) {
  const where: any = {
    userId,
    status: {
      in: ['CONFIRMED', 'WAITLISTED'],
    },
  };

  if (termId) {
    where.termId = termId;
  }

  const enrollments = await prisma.enrollment.findMany({
    where,
    include: {
      course: {
        include: {
          timeSlots: true,
          instructor: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      },
    },
  });

  // Flatten time slots into schedule items
  const scheduleItems: WeeklyScheduleItem[] = [];

  for (const enrollment of enrollments) {
    for (const timeSlot of enrollment.course.timeSlots) {
      scheduleItems.push({
        dayOfWeek: timeSlot.dayOfWeek,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        location: timeSlot.location,
        course: {
          id: enrollment.course.id,
          courseCode: enrollment.course.courseCode,
          courseName: enrollment.course.courseName,
          credits: enrollment.course.credits,
          instructor: enrollment.course.instructor,
        },
        enrollmentStatus: enrollment.status,
      });
    }
  }

  // Sort by day of week and start time
  const dayOrder: Record<DayOfWeek, number> = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 7,
  };

  scheduleItems.sort((a, b) => {
    if (dayOrder[a.dayOfWeek] !== dayOrder[b.dayOfWeek]) {
      return dayOrder[a.dayOfWeek] - dayOrder[b.dayOfWeek];
    }
    return a.startTime.localeCompare(b.startTime);
  });

  return scheduleItems;
}

/**
 * Check for time conflicts between two time slots
 */
export function hasTimeConflict(
  slot1: { dayOfWeek: DayOfWeek; startTime: string; endTime: string },
  slot2: { dayOfWeek: DayOfWeek; startTime: string; endTime: string }
): boolean {
  // Different days = no conflict
  if (slot1.dayOfWeek !== slot2.dayOfWeek) {
    return false;
  }

  // Same day - check time overlap
  const start1 = slot1.startTime;
  const end1 = slot1.endTime;
  const start2 = slot2.startTime;
  const end2 = slot2.endTime;

  // Conflict if:
  // - slot1 starts before slot2 ends AND slot1 ends after slot2 starts
  return start1 < end2 && end1 > start2;
}

/**
 * Check if a course conflicts with user's existing schedule
 */
export async function checkCourseConflicts(userId: number, courseId: number, termId?: number) {
  // Get user's current schedule
  const currentSchedule = await getUserWeeklySchedule(userId, termId);

  // Get the course's time slots
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      timeSlots: true,
    },
  });

  if (!course) {
    throw new Error('Course not found');
  }

  // Check each course time slot against current schedule
  const conflicts: Array<{
    newCourseSlot: TimeSlot;
    conflictingScheduleItem: WeeklyScheduleItem;
  }> = [];

  for (const newSlot of course.timeSlots) {
    for (const existingItem of currentSchedule) {
      if (hasTimeConflict(newSlot, existingItem)) {
        conflicts.push({
          newCourseSlot: newSlot,
          conflictingScheduleItem: existingItem,
        });
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}

/**
 * Get schedule in weekly grid format (7 days x time slots)
 */
export async function getWeeklyGrid(userId: number, termId?: number) {
  const scheduleItems = await getUserWeeklySchedule(userId, termId);

  // Group by day of week
  const grid: Record<DayOfWeek, WeeklyScheduleItem[]> = {
    MONDAY: [],
    TUESDAY: [],
    WEDNESDAY: [],
    THURSDAY: [],
    FRIDAY: [],
    SATURDAY: [],
    SUNDAY: [],
  };

  for (const item of scheduleItems) {
    grid[item.dayOfWeek].push(item);
  }

  return grid;
}

/**
 * Get total enrolled credits for a term
 */
export async function getTotalCredits(userId: number, termId?: number) {
  const where: any = {
    userId,
    status: {
      in: ['CONFIRMED', 'WAITLISTED'],
    },
  };

  if (termId) {
    where.termId = termId;
  }

  const enrollments = await prisma.enrollment.findMany({
    where,
    include: {
      course: {
        select: {
          credits: true,
        },
      },
    },
  });

  const totalCredits = enrollments.reduce((sum, e) => sum + e.course.credits, 0);

  return {
    totalCredits,
    courseCount: enrollments.length,
  };
}
