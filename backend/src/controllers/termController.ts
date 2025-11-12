import { Request, Response } from 'express';
import * as termService from '../services/termService';

/**
 * Term Controller
 * Handles HTTP requests for term endpoints
 */

/**
 * Get all terms
 * GET /api/terms
 */
export async function getAllTerms(req: Request, res: Response) {
  try {
    const terms = await termService.getAllTerms();

    res.status(200).json({
      success: true,
      message: 'Terms retrieved successfully',
      data: terms,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get terms',
    });
  }
}

/**
 * Get active term (current enrollment period)
 * GET /api/terms/active
 */
export async function getActiveTerm(req: Request, res: Response) {
  try {
    const term = await termService.getActiveTerm();

    if (!term) {
      return res.status(404).json({
        success: false,
        message: 'No active enrollment term found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Active term retrieved successfully',
      data: term,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get active term',
    });
  }
}

/**
 * Get term by ID
 * GET /api/terms/:id
 */
export async function getTermById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid term ID',
      });
    }

    const term = await termService.getTermById(id);

    res.status(200).json({
      success: true,
      message: 'Term retrieved successfully',
      data: term,
    });
  } catch (error: any) {
    if (error.message === 'Term not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get term',
    });
  }
}

/**
 * Get courses for a specific term
 * GET /api/terms/:id/courses
 */
export async function getTermCourses(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid term ID',
      });
    }

    const courses = await termService.getTermCourses(id);

    res.status(200).json({
      success: true,
      message: 'Term courses retrieved successfully',
      data: courses,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get term courses',
    });
  }
}
