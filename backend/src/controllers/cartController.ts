import { Response } from 'express';
import * as cartService from '../services/cartService';
import { AuthRequest } from '../types/express.types';
import { ValidationError } from '../utils/errors';

/**
 * Shopping Cart Controller
 * Handles HTTP requests for shopping cart endpoints
 */

/**
 * Get user's shopping cart
 * GET /api/cart
 * Query params: ?termId=1 (optional)
 */
export async function getUserCart(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const termId = req.query.termId ? parseInt(req.query.termId as string) : undefined;

    const cartItems = await cartService.getUserCart(userId, termId);

    res.status(200).json({
      success: true,
      message: 'Shopping cart retrieved successfully',
      data: cartItems,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get shopping cart',
    });
  }
}

/**
 * Get cart summary (total credits, course count)
 * GET /api/cart/summary
 * Query params: ?termId=1 (optional)
 */
export async function getCartSummary(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const termId = req.query.termId ? parseInt(req.query.termId as string) : undefined;

    const summary = await cartService.getCartSummary(userId, termId);

    res.status(200).json({
      success: true,
      message: 'Cart summary retrieved successfully',
      data: summary,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get cart summary',
    });
  }
}

/**
 * Add course to shopping cart
 * POST /api/cart
 * Body: { courseId, termId, notes? }
 */
export async function addToCart(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { courseId, termId, notes } = req.body;

    if (!courseId || !termId) {
      return res.status(400).json({
        success: false,
        message: 'courseId and termId are required',
      });
    }

    const cartItem = await cartService.addToCart(
      userId,
      parseInt(courseId),
      parseInt(termId),
      notes
    );

    res.status(201).json({
      success: true,
      message: 'Course added to shopping cart',
      data: cartItem,
    });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add course to cart',
    });
  }
}

/**
 * Remove course from shopping cart
 * DELETE /api/cart/:cartItemId
 */
export async function removeFromCart(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const cartItemId = parseInt(req.params.cartItemId);

    if (isNaN(cartItemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cart item ID',
      });
    }

    await cartService.removeFromCart(userId, cartItemId);

    res.status(200).json({
      success: true,
      message: 'Course removed from shopping cart',
    });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove course from cart',
    });
  }
}

/**
 * Clear shopping cart
 * DELETE /api/cart
 * Query params: ?termId=1 (optional)
 */
export async function clearCart(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const termId = req.query.termId ? parseInt(req.query.termId as string) : undefined;

    const result = await cartService.clearCart(userId, termId);

    res.status(200).json({
      success: true,
      message: 'Shopping cart cleared',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to clear shopping cart',
    });
  }
}

/**
 * Update cart item notes
 * PATCH /api/cart/:cartItemId
 * Body: { notes }
 */
export async function updateCartItemNotes(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const cartItemId = parseInt(req.params.cartItemId);
    const { notes } = req.body;

    if (isNaN(cartItemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cart item ID',
      });
    }

    const updated = await cartService.updateCartItemNotes(userId, cartItemId, notes);

    res.status(200).json({
      success: true,
      message: 'Cart item notes updated',
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update cart item',
    });
  }
}
