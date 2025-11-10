import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types/express.types';
import { JWTPayload, UserRole } from '../types/user.types';
import { pool } from '../config/database';

/**
 * Middleware to authenticate JWT token
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided. Please authenticate.',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // TODO: Fetch user from database to ensure user still exists and is active
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, role, student_id, major, year, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        message: 'User not found or has been deactivated.',
      });
      return;
    }

    // Attach user information to request object
    req.user = result.rows[0];
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.token = token;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token. Please authenticate again.',
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.',
      });
      return;
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed due to server error.',
    });
  }
};

/**
 * Middleware to require specific role(s)
 * Usage: requireRole('administrator') or requireRole(['administrator', 'instructor'])
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.userRole)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user is a student
 */
export const requireStudent = requireRole('student');

/**
 * Middleware to check if user is an instructor
 */
export const requireInstructor = requireRole('instructor');

/**
 * Middleware to check if user is an administrator
 */
export const requireAdmin = requireRole('administrator');

/**
 * Middleware to check if user is an instructor or administrator
 */
export const requireInstructorOrAdmin = requireRole('instructor', 'administrator');

/**
 * Optional authentication - doesn't fail if no token provided
 * Useful for endpoints that behave differently for authenticated users
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      next();
      return;
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      next();
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    const result = await pool.query(
      `SELECT id, email, first_name, last_name, role, student_id, major, year, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [decoded.userId]
    );

    if (result.rows.length > 0) {
      req.user = result.rows[0];
      req.userId = decoded.userId;
      req.userRole = decoded.role;
      req.token = token;
    }

    next();
  } catch (error) {
    // If token verification fails, just continue without auth
    next();
  }
};
