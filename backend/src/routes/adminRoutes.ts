import { Router } from 'express';
import {
  createCourse,
  updateCourse,
  deleteCourse,
  getAllUsers,
  getSystemStatistics,
  getCourseEnrollments,
} from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);
router.use(adminLimiter);

/**
 * @route   POST /api/admin/courses
 * @desc    Create a new course
 * @access  Private (Admin)
 */
router.post('/courses', asyncHandler(createCourse));

/**
 * @route   PUT /api/admin/courses/:id
 * @desc    Update course
 * @access  Private (Admin)
 */
router.put('/courses/:id', asyncHandler(updateCourse));

/**
 * @route   DELETE /api/admin/courses/:id
 * @desc    Delete course
 * @access  Private (Admin)
 */
router.delete('/courses/:id', asyncHandler(deleteCourse));

/**
 * @route   GET /api/admin/courses/:id/enrollments
 * @desc    Get all enrollments for a specific course
 * @access  Private (Admin)
 */
router.get('/courses/:id/enrollments', asyncHandler(getCourseEnrollments));

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with optional role filter
 * @access  Private (Admin)
 */
router.get('/users', asyncHandler(getAllUsers));

/**
 * @route   GET /api/admin/statistics
 * @desc    Get system statistics
 * @access  Private (Admin)
 */
router.get('/statistics', asyncHandler(getSystemStatistics));

export default router;
