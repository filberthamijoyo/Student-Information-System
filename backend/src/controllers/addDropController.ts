import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query, getClient } from '../config/database';

/**
 * Create a new add/drop request
 */
export async function createRequest(req: AuthRequest, res: Response) {
  const client = await getClient();

  try {
    const { student_id, course_id, request_type, reason, is_late_request } = req.body;

    // Validation
    if (!student_id || !course_id || !request_type || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: student_id, course_id, request_type, reason',
      });
    }

    if (!['ADD', 'DROP'].includes(request_type)) {
      return res.status(400).json({
        success: false,
        error: 'request_type must be either ADD or DROP',
      });
    }

    await client.query('BEGIN');

    // Check if student exists
    const studentCheck = await client.query(
      'SELECT * FROM users WHERE id = $1 AND role = $2',
      [student_id, 'STUDENT']
    );

    if (studentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Student not found',
      });
    }

    // Check if course exists
    const courseCheck = await client.query(
      'SELECT * FROM courses WHERE id = $1',
      [course_id]
    );

    if (courseCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Course not found',
      });
    }

    const course = courseCheck.rows[0];

    // For ADD requests
    if (request_type === 'ADD') {
      // Check if already enrolled
      const enrollmentCheck = await client.query(
        'SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2 AND status IN ($3, $4)',
        [student_id, course_id, 'ENROLLED', 'PENDING']
      );

      if (enrollmentCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Student is already enrolled or has a pending enrollment for this course',
        });
      }

      // Check course capacity
      if (course.current_enrollment >= course.max_capacity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Course is at full capacity',
        });
      }

      // Check unit limits (9-18 units per term)
      const currentEnrollments = await client.query(
        `SELECT COALESCE(SUM(c.credits), 0) as total_credits
         FROM enrollments e
         JOIN courses c ON e.course_id = c.id
         WHERE e.user_id = $1
         AND e.status = 'ENROLLED'
         AND c.semester = $2
         AND c.year = $3`,
        [student_id, course.semester, course.year]
      );

      const currentCredits = parseFloat(currentEnrollments.rows[0].total_credits);
      const newTotalCredits = currentCredits + course.credits;

      // Get enrollment rules
      const minUnitsRule = await client.query(
        "SELECT value FROM enrollment_rules WHERE rule_type = 'MIN_UNITS' ORDER BY effective_date DESC LIMIT 1"
      );
      const maxUnitsRule = await client.query(
        "SELECT value FROM enrollment_rules WHERE rule_type = 'MAX_UNITS' ORDER BY effective_date DESC LIMIT 1"
      );

      const minUnits = minUnitsRule.rows.length > 0 ? parseFloat(minUnitsRule.rows[0].value) : 9;
      const maxUnits = maxUnitsRule.rows.length > 0 ? parseFloat(maxUnitsRule.rows[0].value) : 18;

      if (newTotalCredits > maxUnits) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Adding this course would exceed the maximum unit limit of ${maxUnits}. Current: ${currentCredits}, New total would be: ${newTotalCredits}`,
        });
      }
    }

    // For DROP requests
    if (request_type === 'DROP') {
      // Check if student is enrolled
      const enrollmentCheck = await client.query(
        'SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2 AND status = $3',
        [student_id, course_id, 'ENROLLED']
      );

      if (enrollmentCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Student is not enrolled in this course',
        });
      }

      // Check minimum unit requirement after drop
      const currentEnrollments = await client.query(
        `SELECT COALESCE(SUM(c.credits), 0) as total_credits
         FROM enrollments e
         JOIN courses c ON e.course_id = c.id
         WHERE e.user_id = $1
         AND e.status = 'ENROLLED'
         AND c.semester = $2
         AND c.year = $3`,
        [student_id, course.semester, course.year]
      );

      const currentCredits = parseFloat(currentEnrollments.rows[0].total_credits);
      const newTotalCredits = currentCredits - course.credits;

      const minUnitsRule = await client.query(
        "SELECT value FROM enrollment_rules WHERE rule_type = 'MIN_UNITS' ORDER BY effective_date DESC LIMIT 1"
      );
      const minUnits = minUnitsRule.rows.length > 0 ? parseFloat(minUnitsRule.rows[0].value) : 9;

      if (newTotalCredits < minUnits) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Dropping this course would fall below the minimum unit requirement of ${minUnits}. Current: ${currentCredits}, New total would be: ${newTotalCredits}`,
        });
      }
    }

    // Create the add/drop request
    const insertQuery = `
      INSERT INTO course_add_drop_requests
      (student_id, course_id, request_type, request_date, status, reason, is_late_request)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'PENDING', $4, $5)
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      student_id,
      course_id,
      request_type,
      reason,
      is_late_request || false,
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Add/drop request created successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create add/drop request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create add/drop request',
    });
  } finally {
    client.release();
  }
}

/**
 * Get all requests for a specific student
 */
export async function getMyRequests(req: Request, res: Response) {
  try {
    const { studentId } = req.params;

    const queryText = `
      SELECT
        r.*,
        c.course_code,
        c.course_name,
        c.department,
        c.credits,
        c.semester,
        c.year,
        u.full_name as approver_name
      FROM course_add_drop_requests r
      JOIN courses c ON r.course_id = c.id
      LEFT JOIN users u ON r.approved_by = u.id
      WHERE r.student_id = $1
      ORDER BY r.request_date DESC
    `;

    const result = await query(queryText, [parseInt(studentId)]);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requests',
    });
  }
}

/**
 * Get all pending requests (admin/instructor)
 */
export async function getPendingRequests(req: AuthRequest, res: Response) {
  try {
    const queryText = `
      SELECT
        r.*,
        s.full_name as student_name,
        s.user_identifier as student_id,
        s.major,
        s.year_level,
        c.course_code,
        c.course_name,
        c.department,
        c.credits,
        c.semester,
        c.year
      FROM course_add_drop_requests r
      JOIN users s ON r.student_id = s.id
      JOIN courses c ON r.course_id = c.id
      WHERE r.status = 'PENDING'
      ORDER BY r.request_date ASC
    `;

    const result = await query(queryText);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending requests',
    });
  }
}

/**
 * Approve an add/drop request
 */
export async function approveRequest(req: AuthRequest, res: Response) {
  const client = await getClient();

  try {
    const { requestId } = req.params;
    const { approved_by } = req.body;

    if (!approved_by) {
      return res.status(400).json({
        success: false,
        error: 'approved_by (user_id) is required',
      });
    }

    await client.query('BEGIN');

    // Get the request details
    const requestQuery = await client.query(
      'SELECT * FROM course_add_drop_requests WHERE id = $1',
      [parseInt(requestId)]
    );

    if (requestQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Request not found',
      });
    }

    const request = requestQuery.rows[0];

    if (request.status !== 'PENDING') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Request has already been processed',
      });
    }

    // Get course details
    const courseQuery = await client.query(
      'SELECT * FROM courses WHERE id = $1',
      [request.course_id]
    );
    const course = courseQuery.rows[0];

    if (request.request_type === 'ADD') {
      // Create enrollment record
      await client.query(
        `INSERT INTO enrollments (user_id, course_id, status, enrolled_at)
         VALUES ($1, $2, 'ENROLLED', CURRENT_TIMESTAMP)`,
        [request.student_id, request.course_id]
      );

      // Update course enrollment count
      await client.query(
        'UPDATE courses SET current_enrollment = current_enrollment + 1 WHERE id = $1',
        [request.course_id]
      );
    } else if (request.request_type === 'DROP') {
      // Update enrollment status to DROPPED
      await client.query(
        `UPDATE enrollments
         SET status = 'DROPPED', updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND course_id = $2`,
        [request.student_id, request.course_id]
      );

      // Update course enrollment count
      await client.query(
        'UPDATE courses SET current_enrollment = current_enrollment - 1 WHERE id = $1',
        [request.course_id]
      );
    }

    // Update request status
    await client.query(
      `UPDATE course_add_drop_requests
       SET status = 'APPROVED', approved_by = $1, approved_date = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [approved_by, parseInt(requestId)]
    );

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Request approved successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Approve request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve request',
    });
  } finally {
    client.release();
  }
}

/**
 * Reject an add/drop request
 */
export async function rejectRequest(req: AuthRequest, res: Response) {
  try {
    const { requestId } = req.params;
    const { approved_by, rejection_reason } = req.body;

    if (!approved_by || !rejection_reason) {
      return res.status(400).json({
        success: false,
        error: 'approved_by and rejection_reason are required',
      });
    }

    // Check if request exists and is pending
    const requestCheck = await query(
      'SELECT * FROM course_add_drop_requests WHERE id = $1',
      [parseInt(requestId)]
    );

    if (requestCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Request not found',
      });
    }

    if (requestCheck.rows[0].status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Request has already been processed',
      });
    }

    // Update request status to REJECTED
    const result = await query(
      `UPDATE course_add_drop_requests
       SET status = 'REJECTED', approved_by = $1, approved_date = CURRENT_TIMESTAMP, rejection_reason = $2
       WHERE id = $3
       RETURNING *`,
      [approved_by, rejection_reason, parseInt(requestId)]
    );

    res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Request rejected successfully',
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject request',
    });
  }
}
