import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query, getClient } from '../config/database';

/**
 * Submit a course evaluation
 */
export async function submitEvaluation(req: AuthRequest, res: Response) {
  const client = await getClient();

  try {
    const {
      student_id,
      course_id,
      term,
      year,
      overall_rating,
      instructor_rating,
      course_content_rating,
      workload_rating,
      comments,
      is_anonymous,
    } = req.body;

    // Validation
    if (
      !student_id ||
      !course_id ||
      !term ||
      !year ||
      overall_rating === undefined ||
      instructor_rating === undefined ||
      course_content_rating === undefined ||
      workload_rating === undefined
    ) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Validate ratings are between 1-5
    const ratings = [
      overall_rating,
      instructor_rating,
      course_content_rating,
      workload_rating,
    ];

    for (const rating of ratings) {
      const ratingValue = parseInt(rating);
      if (ratingValue < 1 || ratingValue > 5) {
        return res.status(400).json({
          success: false,
          error: 'All ratings must be between 1 and 5',
        });
      }
    }

    await client.query('BEGIN');

    // Check if student is enrolled in the course
    const enrollmentCheck = await client.query(
      `SELECT e.* FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.user_id = $1
       AND c.id = $2
       AND c.semester = $3
       AND c.year = $4
       AND e.status = 'ENROLLED'`,
      [student_id, course_id, term, year]
    );

    if (enrollmentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        error: 'You must be enrolled in this course to submit an evaluation',
      });
    }

    // Check if evaluation already exists (UPSERT)
    const existingEvaluation = await client.query(
      `SELECT * FROM course_evaluations
       WHERE student_id = $1 AND course_id = $2 AND term = $3 AND year = $4`,
      [student_id, course_id, term, year]
    );

    let result;

    if (existingEvaluation.rows.length > 0) {
      // Update existing evaluation
      result = await client.query(
        `UPDATE course_evaluations
         SET overall_rating = $1,
             instructor_rating = $2,
             course_content_rating = $3,
             workload_rating = $4,
             comments = $5,
             is_anonymous = $6,
             submitted_at = CURRENT_TIMESTAMP
         WHERE student_id = $7 AND course_id = $8 AND term = $9 AND year = $10
         RETURNING *`,
        [
          parseInt(overall_rating),
          parseInt(instructor_rating),
          parseInt(course_content_rating),
          parseInt(workload_rating),
          comments || null,
          is_anonymous !== undefined ? is_anonymous : true,
          student_id,
          course_id,
          term,
          year,
        ]
      );
    } else {
      // Create new evaluation
      result = await client.query(
        `INSERT INTO course_evaluations
         (student_id, course_id, term, year, overall_rating, instructor_rating,
          course_content_rating, workload_rating, comments, is_anonymous, submitted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          student_id,
          course_id,
          term,
          year,
          parseInt(overall_rating),
          parseInt(instructor_rating),
          parseInt(course_content_rating),
          parseInt(workload_rating),
          comments || null,
          is_anonymous !== undefined ? is_anonymous : true,
        ]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Course evaluation submitted successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Submit evaluation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit course evaluation',
    });
  } finally {
    client.release();
  }
}

/**
 * Get all evaluations submitted by a student
 */
export async function getMyEvaluations(req: Request, res: Response) {
  try {
    const { studentId } = req.params;

    const queryText = `
      SELECT
        e.*,
        c.course_code,
        c.course_name,
        c.department
      FROM course_evaluations e
      JOIN courses c ON e.course_id = c.id
      WHERE e.student_id = $1
      ORDER BY e.submitted_at DESC
    `;

    const result = await query(queryText, [parseInt(studentId)]);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get my evaluations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch evaluations',
    });
  }
}

/**
 * Get aggregated statistics for a course
 */
export async function getCourseStats(req: Request, res: Response) {
  try {
    const { courseId } = req.params;

    // Get aggregated statistics
    const statsQuery = `
      SELECT
        COUNT(*) as total_responses,
        ROUND(AVG(overall_rating)::numeric, 2) as average_overall_rating,
        ROUND(AVG(instructor_rating)::numeric, 2) as average_instructor_rating,
        ROUND(AVG(course_content_rating)::numeric, 2) as average_course_content_rating,
        ROUND(AVG(workload_rating)::numeric, 2) as average_workload_rating
      FROM course_evaluations
      WHERE course_id = $1
    `;

    const statsResult = await query(statsQuery, [parseInt(courseId)]);

    // Get non-anonymous comments
    const commentsQuery = `
      SELECT
        e.comments,
        e.submitted_at,
        CASE
          WHEN e.is_anonymous = true THEN 'Anonymous'
          ELSE u.full_name
        END as student_name
      FROM course_evaluations e
      LEFT JOIN users u ON e.student_id = u.id
      WHERE e.course_id = $1
      AND e.comments IS NOT NULL
      AND e.comments != ''
      ORDER BY e.submitted_at DESC
    `;

    const commentsResult = await query(commentsQuery, [parseInt(courseId)]);

    // Get course information
    const courseQuery = await query(
      'SELECT course_code, course_name, department FROM courses WHERE id = $1',
      [parseInt(courseId)]
    );

    res.status(200).json({
      success: true,
      data: {
        course: courseQuery.rows[0],
        statistics: statsResult.rows[0],
        comments: commentsResult.rows,
      },
    });
  } catch (error) {
    console.error('Get course stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch course statistics',
    });
  }
}

/**
 * Get courses that a student is enrolled in but hasn't evaluated yet
 */
export async function getPendingEvaluations(req: Request, res: Response) {
  try {
    const { studentId } = req.params;

    // Get courses from last 3 weeks to end of term that haven't been evaluated
    const queryText = `
      SELECT DISTINCT
        c.id,
        c.course_code,
        c.course_name,
        c.department,
        c.semester,
        c.year,
        c.credits,
        i.full_name as instructor_name
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN users i ON c.instructor_id = i.id
      WHERE e.user_id = $1
      AND e.status = 'ENROLLED'
      AND NOT EXISTS (
        SELECT 1 FROM course_evaluations ce
        WHERE ce.student_id = e.user_id
        AND ce.course_id = c.id
        AND ce.term = c.semester
        AND ce.year = c.year
      )
      ORDER BY c.semester, c.year, c.course_code
    `;

    const result = await query(queryText, [parseInt(studentId)]);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get pending evaluations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending evaluations',
    });
  }
}
