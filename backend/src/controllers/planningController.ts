import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/prisma';
import { AppError } from '../utils/errors';
import { EnrollmentStatus } from '@prisma/client';

/**
 * Get degree audit for the authenticated user
 */
export async function getDegreeAudit(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const student = await prisma.students.findUnique({
      where: { user_id: userId },
      include: {
        majors: {
          include: {
            requirements: true,
          },
        },
        users_students_user_idTousers: {
          include: {
            enrollments: {
              where: {
                status: EnrollmentStatus.CONFIRMED,
              },
              include: {
                courses: true,
                grades: true,
              },
            },
          },
        },
      },
    });

    if (!student || !student.majors) {
      return res.json({
        success: true,
        data: {
          message: 'No major assigned',
          requirements: [],
          progress: {},
        },
      });
    }

    // Filter enrollments to only include those with published grades
    const enrollmentsWithPublishedGrades = student.users_students_user_idTousers.enrollments.filter(
      e => e.grades?.status === 'PUBLISHED'
    );

    // Calculate completed courses
    const completedCourses = enrollmentsWithPublishedGrades.map(e => e.courses.course_code);
    const totalCreditsEarned = enrollmentsWithPublishedGrades.reduce((sum, e) => sum + e.courses.credits, 0);

    // Check each requirement
    const requirementProgress = student.majors.requirements.map(req => {
      const reqCourses = req.courses as string[];
      const completed = completedCourses.filter(code => reqCourses.includes(code));

      return {
        category: req.category,
        name: req.name,
        requiredCredits: req.credits,
        completedCredits: completed.length * 3, // Assuming 3 credits per course
        courses: reqCourses,
        completedCourses: completed,
        percentage: (completed.length * 3 / req.credits) * 100,
      };
    });

    res.json({
      success: true,
      data: {
        major: {
          code: student.majors?.code,
          name: student.majors?.name,
          degree: student.majors?.degree,
          totalCredits: student.majors?.total_credits,
        },
        progress: {
          totalCreditsRequired: student.majors?.total_credits || 120,
          totalCreditsEarned,
          percentageComplete: (totalCreditsEarned / (student.majors?.total_credits || 120)) * 100,
        },
        requirements: requirementProgress,
      },
    });
    return;
  } catch (error) {
    console.error('Get degree audit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch degree audit',
    });
    return;
  }
}

/**
 * Get major requirements
 */
export async function getRequirements(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const student = await prisma.students.findUnique({
      where: { user_id: userId },
      include: {
        majors: {
          include: {
            requirements: true,
          },
        },
      },
    });

    if (!student || !student.majors) {
      return res.json({
        success: true,
        data: [],
        message: 'No major assigned',
      });
    }

    res.json({
      success: true,
      data: student.majors.requirements,
    });
    return;
  } catch (error) {
    console.error('Get requirements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requirements',
    });
    return;
  }
}

/**
 * Get degree progress summary
 */
export async function getProgress(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const student = await prisma.students.findUnique({
      where: { user_id: userId },
      include: {
        majors: true,
        users_students_user_idTousers: {
          include: {
            enrollments: {
              where: {
                status: EnrollmentStatus.CONFIRMED,
              },
              include: {
                courses: true,
                grades: true,
              },
            },
            transcripts: {
              orderBy: {
                generated_at: 'desc',
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!student) {
      throw new AppError('Student record not found', 404);
    }

    // Filter enrollments to only include those with published grades
    const enrollmentsWithPublishedGrades = student.users_students_user_idTousers.enrollments.filter(
      e => e.grades?.status === 'PUBLISHED'
    );

    const totalCreditsEarned = enrollmentsWithPublishedGrades.reduce((sum, e) => sum + e.courses.credits, 0);
    const latestTranscript = student.users_students_user_idTousers.transcripts[0];

    res.json({
      success: true,
      data: {
        major: student.majors?.name,
        year: student.year,
        expectedGraduation: student.expected_grad,
        totalCreditsRequired: student.majors?.total_credits || 120,
        totalCreditsEarned,
        creditsRemaining: (student.majors?.total_credits || 120) - totalCreditsEarned,
        percentageComplete: (totalCreditsEarned / (student.majors?.total_credits || 120)) * 100,
        gpa: latestTranscript?.gpa || 0,
        academicStanding: latestTranscript?.academic_standing || 'N/A',
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      console.error('Get progress error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch progress',
      });
    }
  }
}

/**
 * Get advisor information
 */
export async function getAdvisor(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const student = await prisma.students.findUnique({
      where: { user_id: userId },
      include: {
        users_students_advisor_idTousers: {
          select: {
            id: true,
            full_name: true,
            email: true,
            faculty: true,
          },
        },
      },
    });

    if (!student) {
      throw new AppError('Student record not found', 404);
    }

    if (!student.users_students_advisor_idTousers) {
      return res.json({
        success: true,
        data: null,
        message: 'No advisor assigned',
      });
    }

    res.json({
      success: true,
      data: {
        name: student.users_students_advisor_idTousers.full_name,
        email: student.users_students_advisor_idTousers.email,
        department: student.users_students_advisor_idTousers.faculty?.department,
        office: student.users_students_advisor_idTousers.faculty?.office,
        officeHours: student.users_students_advisor_idTousers.faculty?.office_hours,
        title: student.users_students_advisor_idTousers.faculty?.title,
      },
    });
    return;
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    } else {
      console.error('Get advisor error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch advisor information',
      });
      return;
    }
  }
}

/**
 * Get course plan (placeholder for future implementation)
 */
export async function getCoursePlan(_req: AuthRequest, res: Response) {
  try {
    // This would retrieve a saved course plan
    // For now, return empty
    res.json({
      success: true,
      data: {
        message: 'Course planning feature coming soon',
        savedPlans: [],
      },
    });
  } catch (error) {
    console.error('Get course plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course plan',
    });
  }
}

/**
 * Save course plan (placeholder for future implementation)
 */
export async function saveCoursePlan(_req: AuthRequest, res: Response) {
  try {
    // This would save a course plan
    // For now, just acknowledge
    res.json({
      success: true,
      message: 'Course plan saved (feature coming soon)',
    });
  } catch (error) {
    console.error('Save course plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save course plan',
    });
  }
}
