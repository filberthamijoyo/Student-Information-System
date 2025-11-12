import { Router } from 'express';
import {
  getWeeklySchedule,
  getWeeklyGrid,
  checkCourseConflicts,
  getTotalCredits,
} from '../controllers/scheduleController';
import { requireStudent } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * @route   GET /api/schedule/weekly
 * @desc    Get user's weekly schedule (list format)
 * @access  Private (Student)
 * @query   termId (optional) - filter by term
 */
router.get('/weekly', requireStudent, asyncHandler(getWeeklySchedule));

/**
 * @route   GET /api/schedule/grid
 * @desc    Get user's weekly schedule (grid format)
 * @access  Private (Student)
 * @query   termId (optional) - filter by term
 */
router.get('/grid', requireStudent, asyncHandler(getWeeklyGrid));

/**
 * @route   GET /api/schedule/conflicts/:courseId
 * @desc    Check if a course conflicts with user's existing schedule
 * @access  Private (Student)
 * @query   termId (optional) - filter by term
 */
router.get('/conflicts/:courseId', requireStudent, asyncHandler(checkCourseConflicts));

/**
 * @route   GET /api/schedule/credits
 * @desc    Get total enrolled credits for a term
 * @access  Private (Student)
 * @query   termId (optional) - filter by term
 */
router.get('/credits', requireStudent, asyncHandler(getTotalCredits));

export default router;
