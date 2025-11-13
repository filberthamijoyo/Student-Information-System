import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';

/**
 * Get academic events with optional filtering
 */
export async function getEvents(req: Request, res: Response) {
  try {
    const { term, year } = req.query;

    let queryText = 'SELECT * FROM academic_events WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (term) {
      queryText += ` AND term = $${paramCount}`;
      params.push(term);
      paramCount++;
    }

    if (year) {
      queryText += ` AND year = $${paramCount}`;
      params.push(parseInt(year as string));
      paramCount++;
    }

    queryText += ' ORDER BY start_date ASC';

    const result = await query(queryText, params);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch academic events',
    });
  }
}

/**
 * Check if add/drop period is currently open
 */
export async function getAddDropStatus(req: Request, res: Response) {
  try {
    const queryText = `
      SELECT * FROM academic_events
      WHERE event_type = 'ADD_DROP'
      AND CURRENT_DATE BETWEEN start_date AND end_date
      ORDER BY start_date DESC
      LIMIT 1
    `;

    const result = await query(queryText);

    if (result.rows.length > 0) {
      res.status(200).json({
        success: true,
        data: {
          isOpen: true,
          period: result.rows[0],
        },
      });
    } else {
      res.status(200).json({
        success: true,
        data: {
          isOpen: false,
          period: null,
        },
      });
    }
  } catch (error) {
    console.error('Get add/drop status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check add/drop status',
    });
  }
}

/**
 * Get upcoming events
 */
export async function getUpcomingEvents(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 5;

    const queryText = `
      SELECT * FROM academic_events
      WHERE start_date >= CURRENT_DATE
      ORDER BY start_date ASC
      LIMIT $1
    `;

    const result = await query(queryText, [limit]);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch upcoming events',
    });
  }
}

/**
 * Get holidays
 */
export async function getHolidays(req: Request, res: Response) {
  try {
    const { term, year } = req.query;

    let queryText = `
      SELECT * FROM academic_events
      WHERE event_type = 'HOLIDAY'
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (term) {
      queryText += ` AND term = $${paramCount}`;
      params.push(term);
      paramCount++;
    }

    if (year) {
      queryText += ` AND year = $${paramCount}`;
      params.push(parseInt(year as string));
      paramCount++;
    }

    queryText += ' ORDER BY start_date ASC';

    const result = await query(queryText, params);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get holidays error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch holidays',
    });
  }
}
