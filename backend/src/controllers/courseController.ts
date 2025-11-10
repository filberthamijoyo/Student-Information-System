import { Request, Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../types/express.types';
import { CourseWithSlots, CourseSearchFilters } from '../types/course.types';
import { PaginatedResponse, PaginationQuery } from '../types/api.types';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { getCached, setCached, CACHE_KEYS, CACHE_TTL } from '../config/redis';

/**
 * Get all courses with pagination and filters
 * GET /api/courses
 */
export const getAllCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      department,
      semester,
      year,
      course_code,
      course_name,
      has_available_seats,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build dynamic query
    let queryText = `
      SELECT c.*,
             u.first_name || ' ' || u.last_name as instructor_name,
             u.email as instructor_email
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE 1=1
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    // Add filters
    if (department) {
      queryText += ` AND c.department = $${paramIndex}`;
      queryParams.push(department);
      paramIndex++;
    }

    if (semester) {
      queryText += ` AND c.semester = $${paramIndex}`;
      queryParams.push(semester);
      paramIndex++;
    }

    if (year) {
      queryText += ` AND c.year = $${paramIndex}`;
      queryParams.push(year);
      paramIndex++;
    }

    if (course_code) {
      queryText += ` AND c.course_code ILIKE $${paramIndex}`;
      queryParams.push(`%${course_code}%`);
      paramIndex++;
    }

    if (course_name) {
      queryText += ` AND c.course_name ILIKE $${paramIndex}`;
      queryParams.push(`%${course_name}%`);
      paramIndex++;
    }

    if (has_available_seats === 'true') {
      queryText += ` AND c.current_enrollment < c.max_enrollment`;
    }

    // Add status filter (only show active courses by default)
    queryText += ` AND c.status = 'active'`;

    // Count total
    const countResult = await pool.query(
      queryText.replace('SELECT c.*,', 'SELECT COUNT(*) as total,').split('FROM')[0] + ' FROM' + queryText.split('FROM')[1]
    );
    const total = parseInt(countResult.rows[0]?.total || 0);

    // Add pagination
    queryText += ` ORDER BY c.course_code LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(Number(limit), offset);

    const result = await pool.query(queryText, queryParams);

    // TODO: Fetch time slots for each course
    const courses = result.rows;

    const response: PaginatedResponse<CourseWithSlots> = {
      success: true,
      message: 'Courses retrieved successfully',
      data: courses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
        hasNext: offset + courses.length < total,
        hasPrev: Number(page) > 1,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    throw error;
  }
};

/**
 * Get course by ID with time slots
 * GET /api/courses/:id
 */
export const getCourseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Try to get from cache first
    const cacheKey = `${CACHE_KEYS.COURSE}${id}`;
    const cached = await getCached<CourseWithSlots>(cacheKey);

    if (cached) {
      res.status(200).json({
        success: true,
        message: 'Course retrieved successfully (cached)',
        data: cached,
      });
      return;
    }

    // Get course details
    const courseResult = await pool.query(
      `SELECT c.*,
              u.first_name || ' ' || u.last_name as instructor_name,
              u.email as instructor_email
       FROM courses c
       LEFT JOIN users u ON c.instructor_id = u.id
       WHERE c.id = $1`,
      [id]
    );

    if (courseResult.rows.length === 0) {
      throw new NotFoundError('Course not found');
    }

    const course = courseResult.rows[0];

    // Get time slots
    const slotsResult = await pool.query(
      'SELECT * FROM time_slots WHERE course_id = $1 ORDER BY day_of_week, start_time',
      [id]
    );

    const courseWithSlots: CourseWithSlots = {
      ...course,
      time_slots: slotsResult.rows,
    };

    // Cache the result
    await setCached(cacheKey, courseWithSlots, CACHE_TTL.MEDIUM);

    res.status(200).json({
      success: true,
      message: 'Course retrieved successfully',
      data: courseWithSlots,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Search courses
 * GET /api/courses/search
 */
export const searchCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      throw new BadRequestError('Search query is required');
    }

    const searchQuery = `%${q}%`;

    const result = await pool.query(
      `SELECT c.*,
              u.first_name || ' ' || u.last_name as instructor_name,
              u.email as instructor_email
       FROM courses c
       LEFT JOIN users u ON c.instructor_id = u.id
       WHERE (c.course_code ILIKE $1 OR c.course_name ILIKE $1 OR c.description ILIKE $1)
         AND c.status = 'active'
       LIMIT 50`,
      [searchQuery]
    );

    res.status(200).json({
      success: true,
      message: `Found ${result.rows.length} courses`,
      data: result.rows,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get courses by department
 * GET /api/courses/department/:department
 */
export const getCoursesByDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { department } = req.params;

    const result = await pool.query(
      `SELECT c.*,
              u.first_name || ' ' || u.last_name as instructor_name
       FROM courses c
       LEFT JOIN users u ON c.instructor_id = u.id
       WHERE c.department = $1 AND c.status = 'active'
       ORDER BY c.course_code`,
      [department]
    );

    res.status(200).json({
      success: true,
      message: `Found ${result.rows.length} courses in ${department}`,
      data: result.rows,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get all unique departments
 * GET /api/courses/departments
 */
export const getDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT department
       FROM courses
       WHERE status = 'active'
       ORDER BY department`
    );

    res.status(200).json({
      success: true,
      message: 'Departments retrieved successfully',
      data: result.rows.map(row => row.department),
    });
  } catch (error) {
    throw error;
  }
};
