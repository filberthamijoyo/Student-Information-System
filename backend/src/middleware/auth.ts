import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express.types';
import { verifyAccessToken } from '../services/authService';
import { prisma } from '../config/prisma';

/**
 * Authentication Middleware (Prisma-based)
 */

/**
 * Authenticate JWT token
 */
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = verifyAccessToken(token);

    // Fetch user to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        userIdentifier: true,
        email: true,
        fullName: true,
        role: true,
        major: true,
        yearLevel: true,
        department: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Attach user to request
    (req as any).user = user;
    (req as any).userId = user.id;
    (req as any).userRole = user.role;
    (req as any).token = token;

    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid token'
    });
  }
}

/**
 * Require specific role(s)
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = (req as any).userRole;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}

/**
 * Pre-defined role middlewares
 */
export const requireStudent = requireRole('STUDENT');
export const requireInstructor = requireRole('INSTRUCTOR');
export const requireAdmin = requireRole('ADMINISTRATOR');
export const requireInstructorOrAdmin = requireRole('INSTRUCTOR', 'ADMINISTRATOR');

/**
 * Optional authentication
 */
export async function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (user) {
      (req as any).user = user;
      (req as any).userId = user.id;
      (req as any).userRole = user.role;
    }

    next();
  } catch (error) {
    // Continue without auth if token is invalid
    next();
  }
}
