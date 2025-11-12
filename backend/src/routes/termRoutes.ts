import { Router } from 'express';
import {
  getAllTerms,
  getActiveTerm,
  getTermById,
  getTermCourses,
} from '../controllers/termController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * @route   GET /api/terms
 * @desc    Get all terms
 * @access  Public
 */
router.get('/', asyncHandler(getAllTerms));

/**
 * @route   GET /api/terms/active
 * @desc    Get active term (current enrollment period)
 * @access  Public
 */
router.get('/active', asyncHandler(getActiveTerm));

/**
 * @route   GET /api/terms/:id
 * @desc    Get term by ID
 * @access  Public
 */
router.get('/:id', asyncHandler(getTermById));

/**
 * @route   GET /api/terms/:id/courses
 * @desc    Get all courses for a specific term
 * @access  Public
 */
router.get('/:id/courses', asyncHandler(getTermCourses));

export default router;
