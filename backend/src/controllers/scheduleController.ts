import { Response } from 'express';
import * as scheduleService from '../services/scheduleService';
import { AuthRequest } from '../types/express.types';

/**
 * Schedule Controller
 * Handles HTTP requests for schedule endpoints
 */

/**
 * Get user's weekly schedule
 * GET /api/schedule/weekly
 * Query params: ?termId=1 (optional)
 */
export async function getWeeklySchedule(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const termId = req.query.termId ? parseInt(req.query.termId as string) : undefined;

    const schedule = await scheduleService.getUserWeeklySchedule(userId, termId);

    res.status(200).json({
      success: true,
      message: 'Weekly schedule retrieved successfully',
      data: schedule,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get weekly schedule',
    });
  }
}

/**
 * Get weekly schedule in grid format
 * GET /api/schedule/grid
 * Query params: ?termId=1 (optional)
 */
export async function getWeeklyGrid(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const termId = req.query.termId ? parseInt(req.query.termId as string) : undefined;

    const grid = await scheduleService.getWeeklyGrid(userId, termId);

    res.status(200).json({
      success: true,
      message: 'Weekly grid retrieved successfully',
      data: grid,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get weekly grid',
    });
  }
}

/**
 * Check for course conflicts with existing schedule
 * GET /api/schedule/conflicts/:courseId
 * Query params: ?termId=1 (optional)
 */
export async function checkCourseConflicts(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const courseId = parseInt(req.params.courseId);
    const termId = req.query.termId ? parseInt(req.query.termId as string) : undefined;

    if (isNaN(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID',
      });
    }

    const result = await scheduleService.checkCourseConflicts(userId, courseId, termId);

    res.status(200).json({
      success: true,
      message: 'Conflict check completed',
      data: result,
    });
  } catch (error: any) {
    if (error.message === 'Course not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check course conflicts',
    });
  }
}

/**
 * Get total enrolled credits
 * GET /api/schedule/credits
 * Query params: ?termId=1 (optional)
 */
export async function getTotalCredits(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const termId = req.query.termId ? parseInt(req.query.termId as string) : undefined;

    const result = await scheduleService.getTotalCredits(userId, termId);

    res.status(200).json({
      success: true,
      message: 'Total credits retrieved successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get total credits',
    });
  }
}
