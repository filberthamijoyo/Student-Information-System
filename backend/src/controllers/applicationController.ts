import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { Role } from '@prisma/client';

/**
 * Get all applications for the authenticated user
 */
export async function getMyApplications(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const applications = await prisma.application.findMany({
      where: { userId },
      orderBy: {
        requestedDate: 'desc',
      },
    });

    res.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
    });
  }
}

/**
 * Submit a new application
 */
export async function submitApplication(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { type, semester, year, reason, supportingDocs } = req.body;

    if (!type || !reason) {
      throw new AppError('Type and reason are required', 400);
    }

    const application = await prisma.application.create({
      data: {
        userId,
        type,
        semester: semester || null,
        year: year ? parseInt(year) : null,
        reason,
        supportingDocs: supportingDocs || null,
        status: 'PENDING',
      },
    });

    res.json({
      success: true,
      message: 'Application submitted successfully',
      data: application,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      console.error('Submit application error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit application',
      });
    }
  }
}

/**
 * Get a specific application
 */
export async function getApplication(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const application = await prisma.application.findFirst({
      where: {
        id: parseInt(id),
        userId,
      },
      include: {
        reviewer: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      console.error('Get application error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch application',
      });
    }
  }
}

/**
 * Withdraw an application
 */
export async function withdrawApplication(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const application = await prisma.application.findFirst({
      where: {
        id: parseInt(id),
        userId,
      },
    });

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (application.status !== 'PENDING' && application.status !== 'UNDER_REVIEW') {
      throw new AppError('Cannot withdraw application in current status', 400);
    }

    const updatedApplication = await prisma.application.update({
      where: { id: parseInt(id) },
      data: { status: 'WITHDRAWN' },
    });

    res.json({
      success: true,
      message: 'Application withdrawn successfully',
      data: updatedApplication,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      console.error('Withdraw application error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to withdraw application',
      });
    }
  }
}

/**
 * Get all pending applications (admin only)
 */
export async function getPendingApplications(req: AuthRequest, res: Response) {
  try {
    const user = req.user!;

    if (user.role !== Role.ADMINISTRATOR) {
      throw new AppError('Unauthorized', 403);
    }

    const applications = await prisma.application.findMany({
      where: {
        status: {
          in: ['PENDING', 'UNDER_REVIEW'],
        },
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            student: {
              select: {
                studentId: true,
                major: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        requestedDate: 'asc',
      },
    });

    res.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      console.error('Get pending applications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch applications',
      });
    }
  }
}

/**
 * Review an application (admin only)
 */
export async function reviewApplication(req: AuthRequest, res: Response) {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { status, decision, reviewNotes } = req.body;

    if (user.role !== Role.ADMINISTRATOR) {
      throw new AppError('Unauthorized', 403);
    }

    if (!status || !decision) {
      throw new AppError('Status and decision are required', 400);
    }

    const application = await prisma.application.findUnique({
      where: { id: parseInt(id) },
    });

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    const updatedApplication = await prisma.application.update({
      where: { id: parseInt(id) },
      data: {
        status,
        decision,
        reviewNotes: reviewNotes || null,
        reviewedBy: user.id,
        reviewedAt: new Date(),
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Application reviewed successfully',
      data: updatedApplication,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      console.error('Review application error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to review application',
      });
    }
  }
}
