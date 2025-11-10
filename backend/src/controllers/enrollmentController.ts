import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../types/express.types';
import { EnrollmentRequest, EnrollmentResponse, EnrollmentQueueJobData } from '../types/enrollment.types';
import { BadRequestError, NotFoundError, ConflictError, ForbiddenError } from '../middleware/errorHandler';
import { addEnrollmentJob } from '../config/queue';

/**
 * Enroll in a course
 * POST /api/enrollments
 */
export const enrollInCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { course_id }: EnrollmentRequest = req.body;
    const student_id = req.userId;

    if (!student_id) {
      throw new ForbiddenError('Only students can enroll in courses');
    }

    // TODO: Validate enrollment using conflict detection utility

    // Check if course exists and is active
    const courseResult = await pool.query(
      'SELECT id, course_code, course_name, max_enrollment, current_enrollment, status FROM courses WHERE id = $1',
      [course_id]
    );

    if (courseResult.rows.length === 0) {
      throw new NotFoundError('Course not found');
    }

    const course = courseResult.rows[0];

    if (course.status !== 'active') {
      throw new BadRequestError('Course is not available for enrollment');
    }

    // Check if already enrolled
    const existingEnrollment = await pool.query(
      `SELECT id, status FROM enrollments
       WHERE student_id = $1 AND course_id = $2 AND status IN ('enrolled', 'waitlisted', 'pending')`,
      [student_id, course_id]
    );

    if (existingEnrollment.rows.length > 0) {
      throw new ConflictError('You are already enrolled or waitlisted for this course');
    }

    // Check if course is full
    const isFull = course.current_enrollment >= course.max_enrollment;
    const status = isFull ? 'waitlisted' : 'pending';

    // Create enrollment record
    const enrollmentResult = await pool.query(
      `INSERT INTO enrollments (student_id, course_id, status, enrolled_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, student_id, course_id, status, enrolled_at, created_at`,
      [student_id, course_id, status]
    );

    const enrollment = enrollmentResult.rows[0];

    // Add to queue for processing
    const jobData: EnrollmentQueueJobData = {
      student_id: student_id,
      course_id: course_id,
      enrollment_id: enrollment.id,
      attempt: 1,
      timestamp: new Date(),
    };

    const job = await addEnrollmentJob(jobData, isFull ? 1 : 0);

    const response: EnrollmentResponse = {
      success: true,
      message: isFull
        ? 'You have been added to the waitlist'
        : 'Enrollment request submitted successfully',
      data: {
        enrollment,
        status,
        queue_position: job.id ? parseInt(job.id.toString()) : undefined,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    throw error;
  }
};

/**
 * Drop a course
 * DELETE /api/enrollments/:courseId
 */
export const dropCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const student_id = req.userId;

    if (!student_id) {
      throw new ForbiddenError('Authentication required');
    }

    // Find enrollment
    const enrollmentResult = await pool.query(
      `SELECT id, status FROM enrollments
       WHERE student_id = $1 AND course_id = $2 AND status IN ('enrolled', 'waitlisted')`,
      [student_id, courseId]
    );

    if (enrollmentResult.rows.length === 0) {
      throw new NotFoundError('Enrollment not found');
    }

    const enrollment = enrollmentResult.rows[0];

    // Update enrollment status to dropped
    await pool.query(
      `UPDATE enrollments
       SET status = 'dropped', dropped_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [enrollment.id]
    );

    // If student was enrolled (not waitlisted), decrement course enrollment count
    if (enrollment.status === 'enrolled') {
      await pool.query(
        `UPDATE courses
         SET current_enrollment = current_enrollment - 1, updated_at = NOW()
         WHERE id = $1`,
        [courseId]
      );

      // TODO: Process waitlist and enroll next student if any
    }

    res.status(200).json({
      success: true,
      message: 'Course dropped successfully',
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get student's enrollments
 * GET /api/enrollments/my-courses
 */
export const getMyEnrollments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student_id = req.userId;

    if (!student_id) {
      throw new ForbiddenError('Authentication required');
    }

    const result = await pool.query(
      `SELECT e.*,
              c.course_code, c.course_name, c.credits, c.semester, c.year, c.department,
              u.first_name || ' ' || u.last_name as instructor_name
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN users u ON c.instructor_id = u.id
       WHERE e.student_id = $1 AND e.status IN ('enrolled', 'waitlisted', 'pending')
       ORDER BY e.enrolled_at DESC`,
      [student_id]
    );

    // Calculate total credits
    const totalCredits = result.rows
      .filter(row => row.status === 'enrolled')
      .reduce((sum, row) => sum + row.credits, 0);

    res.status(200).json({
      success: true,
      message: 'Enrollments retrieved successfully',
      data: {
        enrollments: result.rows,
        total_enrolled: result.rows.filter(r => r.status === 'enrolled').length,
        total_waitlisted: result.rows.filter(r => r.status === 'waitlisted').length,
        total_credits: totalCredits,
      },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get enrollment history
 * GET /api/enrollments/history
 */
export const getEnrollmentHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student_id = req.userId;

    if (!student_id) {
      throw new ForbiddenError('Authentication required');
    }

    const result = await pool.query(
      `SELECT e.*,
              c.course_code, c.course_name, c.credits, c.semester, c.year,
              u.first_name || ' ' || u.last_name as instructor_name
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN users u ON c.instructor_id = u.id
       WHERE e.student_id = $1
       ORDER BY e.enrolled_at DESC`,
      [student_id]
    );

    res.status(200).json({
      success: true,
      message: 'Enrollment history retrieved successfully',
      data: result.rows,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Check enrollment eligibility
 * POST /api/enrollments/check-eligibility
 */
export const checkEnrollmentEligibility = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { course_id } = req.body;
    const student_id = req.userId;

    if (!student_id) {
      throw new ForbiddenError('Authentication required');
    }

    // TODO: Implement comprehensive eligibility check
    // - Time conflicts
    // - Prerequisites
    // - Credit limits
    // - Already enrolled

    res.status(200).json({
      success: true,
      message: 'Eligibility check completed',
      data: {
        eligible: true,
        conflicts: [],
        warnings: [],
      },
    });
  } catch (error) {
    throw error;
  }
};
