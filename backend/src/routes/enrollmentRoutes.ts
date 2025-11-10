import { Router } from 'express';
import {
  enrollInCourse,
  dropCourse,
  getMyEnrollments,
  getEnrollmentHistory,
  checkEnrollmentEligibility,
} from '../controllers/enrollmentController';
import { authenticate, requireStudent } from '../middleware/auth';
import { enrollmentLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All enrollment routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/enrollments
 * @desc    Enroll in a course
 * @access  Private (Student)
 */
router.post('/', requireStudent, enrollmentLimiter, asyncHandler(enrollInCourse));

/**
 * @route   DELETE /api/enrollments/:courseId
 * @desc    Drop a course
 * @access  Private (Student)
 */
router.delete('/:courseId', requireStudent, asyncHandler(dropCourse));

/**
 * @route   GET /api/enrollments/my-courses
 * @desc    Get student's current enrollments
 * @access  Private (Student)
 */
router.get('/my-courses', requireStudent, asyncHandler(getMyEnrollments));

/**
 * @route   GET /api/enrollments/history
 * @desc    Get student's enrollment history
 * @access  Private (Student)
 */
router.get('/history', requireStudent, asyncHandler(getEnrollmentHistory));

/**
 * @route   POST /api/enrollments/check-eligibility
 * @desc    Check if student is eligible to enroll in a course
 * @access  Private (Student)
 */
router.post('/check-eligibility', requireStudent, asyncHandler(checkEnrollmentEligibility));

export default router;
