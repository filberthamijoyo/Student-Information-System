import { Router } from 'express';
import {
  getUserCart,
  getCartSummary,
  addToCart,
  removeFromCart,
  clearCart,
  updateCartItemNotes,
} from '../controllers/cartController';
import { requireStudent } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * @route   GET /api/cart
 * @desc    Get user's shopping cart
 * @access  Private (Student)
 * @query   termId (optional) - filter by term
 */
router.get('/', requireStudent, asyncHandler(getUserCart));

/**
 * @route   GET /api/cart/summary
 * @desc    Get cart summary (total credits, course count)
 * @access  Private (Student)
 * @query   termId (optional) - filter by term
 */
router.get('/summary', requireStudent, asyncHandler(getCartSummary));

/**
 * @route   POST /api/cart
 * @desc    Add course to shopping cart
 * @access  Private (Student)
 * @body    { courseId, termId, notes? }
 */
router.post('/', requireStudent, asyncHandler(addToCart));

/**
 * @route   PATCH /api/cart/:cartItemId
 * @desc    Update cart item notes
 * @access  Private (Student)
 * @body    { notes }
 */
router.patch('/:cartItemId', requireStudent, asyncHandler(updateCartItemNotes));

/**
 * @route   DELETE /api/cart/:cartItemId
 * @desc    Remove course from shopping cart
 * @access  Private (Student)
 */
router.delete('/:cartItemId', requireStudent, asyncHandler(removeFromCart));

/**
 * @route   DELETE /api/cart
 * @desc    Clear shopping cart
 * @access  Private (Student)
 * @query   termId (optional) - clear only items for specific term
 */
router.delete('/', requireStudent, asyncHandler(clearCart));

export default router;
