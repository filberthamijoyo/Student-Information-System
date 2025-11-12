import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { AppError } from '../utils/errors';

/**
 * Get degree audit for the authenticated user
 */
export async function getDegreeAudit(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        major: {
          include: {
            requirements: true,
          },
        },
        user: {
          include: {
            enrollments: {
              where: {
                status: 'CONFIRMED',
                grade: {
                  status: 'PUBLISHED',
                },
              },
              include: {
                course: true,
                grade: true,
              },
            },
          },
        },
      },
    });

    if (!student || !student.major) {
      return res.json({
        success: true,
        data: {
          message: 'No major assigned',
          requirements: [],
          progress: {},
        },
      });
    }

    // Calculate completed courses
    const completedCourses = student.user.enrollments.map(e => e.course.courseCode);
    const totalCreditsEarned = student.user.enrollments.reduce((sum, e) => sum + e.course.credits, 0);

    // Check each requirement
    const requirementProgress = student.major.requirements.map(req => {
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
          code: student.major.code,
          name: student.major.name,
          degree: student.major.degree,
          totalCredits: student.major.totalCredits,
        },
        progress: {
          totalCreditsRequired: student.major.totalCredits,
          totalCreditsEarned,
          percentageComplete: (totalCreditsEarned / student.major.totalCredits) * 100,
        },
        requirements: requirementProgress,
      },
    });
  } catch (error) {
    console.error('Get degree audit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch degree audit',
    });
  }
}

/**
 * Get major requirements
 */
export async function getRequirements(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        major: {
          include: {
            requirements: true,
          },
        },
      },
    });

    if (!student || !student.major) {
      return res.json({
        success: true,
        data: [],
        message: 'No major assigned',
      });
    }

    res.json({
      success: true,
      data: student.major.requirements,
    });
  } catch (error) {
    console.error('Get requirements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requirements',
    });
  }
}

/**
 * Get degree progress summary
 */
export async function getProgress(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        major: true,
        user: {
          include: {
            enrollments: {
              where: {
                status: 'CONFIRMED',
                grade: {
                  status: 'PUBLISHED',
                },
              },
              include: {
                course: true,
              },
            },
            transcripts: {
              orderBy: {
                generatedAt: 'desc',
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

    const totalCreditsEarned = student.user.enrollments.reduce((sum, e) => sum + e.course.credits, 0);
    const latestTranscript = student.user.transcripts[0];

    res.json({
      success: true,
      data: {
        major: student.major?.name,
        year: student.year,
        expectedGraduation: student.expectedGrad,
        totalCreditsRequired: student.major?.totalCredits || 120,
        totalCreditsEarned,
        creditsRemaining: (student.major?.totalCredits || 120) - totalCreditsEarned,
        percentageComplete: (totalCreditsEarned / (student.major?.totalCredits || 120)) * 100,
        gpa: latestTranscript?.gpa || 0,
        academicStanding: latestTranscript?.academicStanding || 'N/A',
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

    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        advisor: {
          include: {
            faculty: true,
          },
        },
      },
    });

    if (!student) {
      throw new AppError('Student record not found', 404);
    }

    if (!student.advisor) {
      return res.json({
        success: true,
        data: null,
        message: 'No advisor assigned',
      });
    }

    res.json({
      success: true,
      data: {
        name: student.advisor.fullName,
        email: student.advisor.email,
        department: student.advisor.faculty?.department,
        office: student.advisor.faculty?.office,
        officeHours: student.advisor.faculty?.officeHours,
        title: student.advisor.faculty?.title,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      console.error('Get advisor error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch advisor information',
      });
    }
  }
}

/**
 * Get course plan (placeholder for future implementation)
 */
export async function getCoursePlan(req: AuthRequest, res: Response) {
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
export async function saveCoursePlan(req: AuthRequest, res: Response) {
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
