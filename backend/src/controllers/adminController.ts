import { Response } from 'express';
import { pool, getClient } from '../config/database';
import { AuthRequest } from '../types/express.types';
import { CourseCreateRequest, CourseUpdateRequest, TimeSlotCreateRequest } from '../types/course.types';
import { BadRequestError, NotFoundError, ConflictError } from '../middleware/errorHandler';
import { deleteCached, deleteCachedPattern, CACHE_KEYS } from '../config/redis';

/**
 * Create a new course
 * POST /api/admin/courses
 */
export const createCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const {
      course_code,
      course_name,
      description,
      credits,
      instructor_id,
      department,
      semester,
      year,
      max_enrollment,
      prerequisites,
      time_slots,
    }: CourseCreateRequest = req.body;

    // TODO: Add validation

    // Check if course code already exists for this semester/year
    const existing = await client.query(
      'SELECT id FROM courses WHERE course_code = $1 AND semester = $2 AND year = $3',
      [course_code, semester, year]
    );

    if (existing.rows.length > 0) {
      throw new ConflictError('Course with this code already exists for the specified semester and year');
    }

    // Insert course
    const courseResult = await client.query(
      `INSERT INTO courses (
        course_code, course_name, description, credits, instructor_id,
        department, semester, year, max_enrollment, current_enrollment,
        prerequisites, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10, 'active')
      RETURNING *`,
      [
        course_code,
        course_name,
        description,
        credits,
        instructor_id,
        department,
        semester,
        year,
        max_enrollment,
        prerequisites ? JSON.stringify(prerequisites) : null,
      ]
    );

    const course = courseResult.rows[0];

    // Insert time slots
    const insertedSlots = [];
    for (const slot of time_slots) {
      const slotResult = await client.query(
        `INSERT INTO time_slots (course_id, day_of_week, start_time, end_time, location)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [course.id, slot.day_of_week, slot.start_time, slot.end_time, slot.location]
      );
      insertedSlots.push(slotResult.rows[0]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: {
        ...course,
        time_slots: insertedSlots,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update course
 * PUT /api/admin/courses/:id
 */
export const updateCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates: CourseUpdateRequest = req.body;

    // Build dynamic update query
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.course_name) {
      fields.push(`course_name = $${paramIndex}`);
      values.push(updates.course_name);
      paramIndex++;
    }

    if (updates.description) {
      fields.push(`description = $${paramIndex}`);
      values.push(updates.description);
      paramIndex++;
    }

    if (updates.max_enrollment !== undefined) {
      fields.push(`max_enrollment = $${paramIndex}`);
      values.push(updates.max_enrollment);
      paramIndex++;
    }

    if (updates.status) {
      fields.push(`status = $${paramIndex}`);
      values.push(updates.status);
      paramIndex++;
    }

    if (updates.prerequisites) {
      fields.push(`prerequisites = $${paramIndex}`);
      values.push(JSON.stringify(updates.prerequisites));
      paramIndex++;
    }

    if (fields.length === 0) {
      throw new BadRequestError('No fields to update');
    }

    fields.push('updated_at = NOW()');
    values.push(id);

    const query = `UPDATE courses SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new NotFoundError('Course not found');
    }

    // Invalidate cache
    await deleteCached(`${CACHE_KEYS.COURSE}${id}`);

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Delete course
 * DELETE /api/admin/courses/:id
 */
export const deleteCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if course has enrollments
    const enrollmentCheck = await pool.query(
      `SELECT COUNT(*) as count FROM enrollments
       WHERE course_id = $1 AND status = 'enrolled'`,
      [id]
    );

    if (parseInt(enrollmentCheck.rows[0].count) > 0) {
      throw new BadRequestError('Cannot delete course with active enrollments');
    }

    // Soft delete by updating status
    const result = await pool.query(
      `UPDATE courses SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Course not found');
    }

    // Invalidate cache
    await deleteCached(`${CACHE_KEYS.COURSE}${id}`);

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get all users (admin only)
 * GET /api/admin/users
 */
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, page = 1, limit = 50 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT id, email, first_name, last_name, role, student_id, major, year, created_at, updated_at
      FROM users
    `;

    const params: any[] = [];
    if (role) {
      query += ' WHERE role = $1';
      params.push(role);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: result.rows,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get system statistics
 * GET /api/admin/statistics
 */
export const getSystemStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // TODO: Implement comprehensive statistics
    // - Total users by role
    // - Total courses
    // - Total enrollments
    // - Enrollment by semester
    // - Popular courses

    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
        (SELECT COUNT(*) FROM users WHERE role = 'instructor') as total_instructors,
        (SELECT COUNT(*) FROM users WHERE role = 'administrator') as total_admins,
        (SELECT COUNT(*) FROM courses WHERE status = 'active') as total_courses,
        (SELECT COUNT(*) FROM enrollments WHERE status = 'enrolled') as total_enrollments,
        (SELECT COUNT(*) FROM enrollments WHERE status = 'waitlisted') as total_waitlisted
    `);

    res.status(200).json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: stats.rows[0],
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get course enrollments (admin view)
 * GET /api/admin/courses/:id/enrollments
 */
export const getCourseEnrollments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT e.*,
              u.email, u.first_name, u.last_name, u.student_id, u.major, u.year
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       WHERE e.course_id = $1 AND e.status IN ('enrolled', 'waitlisted')
       ORDER BY e.status, e.enrolled_at`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Course enrollments retrieved successfully',
      data: result.rows,
    });
  } catch (error) {
    throw error;
  }
};
