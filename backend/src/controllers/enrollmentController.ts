import { Response } from 'express';
import { AuthRequest } from '../types/express.types';
import * as enrollmentService from '../services/enrollmentService';

/**
 * Enrollment Controller (Prisma-based with Queue)
 * Handles HTTP requests for enrollment endpoints
 */

/**
 * Enroll in a course (queued)
 * POST /api/enrollments
 */
export async function enrollInCourse(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { courseId } = req.body;
    const userId = (req as any).userId || (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await enrollmentService.queueEnrollment(userId, courseId);

    res.status(202).json({
      success: true,
      message: 'Enrollment request queued',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Enrollment failed'
    });
  }
}

/**
 * Drop a course
 * DELETE /api/enrollments/:enrollmentId
 */
export async function dropCourse(req: AuthRequest, res: Response): Promise<void> {
  try {
    const enrollmentId = parseInt(req.params.enrollmentId);
    const userId = (req as any).userId || (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const result = await enrollmentService.dropEnrollment(enrollmentId, userId);

    res.status(200).json({
      success: true,
      message: 'Course dropped successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Drop course failed'
    });
  }
}

/**
 * Get my enrollments
 * GET /api/enrollments/my-courses
 */
export async function getMyEnrollments(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId || (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const enrollments = await enrollmentService.getUserEnrollments(userId);

    res.status(200).json({
      success: true,
      data: enrollments
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get enrollments'
    });
  }
}

/**
 * Get enrollment job status
 * GET /api/enrollments/status/:jobId
 */
export async function getEnrollmentStatus(req: AuthRequest, res: Response) {
  try {
    const { jobId } = req.params;

    const status = await enrollmentService.getEnrollmentJobStatus(jobId);

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get job status'
    });
  }
}

/**
 * Get course waitlist
 * GET /api/enrollments/waitlist/:courseId
 */
export async function getCourseWaitlist(req: AuthRequest, res: Response) {
  try {
    const courseId = parseInt(req.params.courseId);

    const waitlist = await enrollmentService.getCourseWaitlist(courseId);

    res.status(200).json({
      success: true,
      data: {
        waitlist,
        count: waitlist.length
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get waitlist'
    });
  }
}
