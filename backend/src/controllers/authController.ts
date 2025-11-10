import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { RegisterRequest, LoginRequest, AuthResponse, SafeUser, JWTPayload } from '../types/user.types';
import { AuthRequest } from '../types/express.types';
import { BadRequestError, UnauthorizedError, ConflictError } from '../middleware/errorHandler';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, first_name, last_name, role, student_id, major, year }: RegisterRequest = req.body;

    // TODO: Add validation using Joi schema

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, student_id, major, year)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, first_name, last_name, role, student_id, major, year, created_at, updated_at`,
      [email, password_hash, first_name, last_name, role, student_id, major, year]
    );

    const user: SafeUser = result.rows[0];

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET!;
    const jwtExpiry = process.env.JWT_EXPIRY || '24h';

    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiry });

    const response: AuthResponse = {
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    throw error;
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    // TODO: Add validation

    // Find user by email
    const result = await pool.query(
      `SELECT id, email, password_hash, first_name, last_name, role, student_id, major, year, created_at, updated_at
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Remove password_hash from user object
    const { password_hash, ...safeUser } = user;

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET!;
    const jwtExpiry = process.env.JWT_EXPIRY || '24h';

    const payload: JWTPayload = {
      userId: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiry });

    const response: AuthResponse = {
      success: true,
      message: 'Login successful',
      data: {
        user: safeUser,
        token,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    throw error;
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: req.user,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Logout user (client-side token removal)
 * POST /api/auth/logout
 */
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // TODO: Implement token blacklisting using Redis if needed

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Refresh JWT token
 * POST /api/auth/refresh
 */
export const refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // TODO: Implement refresh token logic
    // This would involve:
    // 1. Verify refresh token
    // 2. Generate new access token
    // 3. Return new token

    res.status(501).json({
      success: false,
      message: 'Refresh token endpoint not yet implemented',
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Change password
 * POST /api/auth/change-password
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!req.userId) {
      throw new UnauthorizedError('Not authenticated');
    }

    // TODO: Add validation for password strength

    // Get current user with password
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedError('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);

    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, req.userId]
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    throw error;
  }
};
