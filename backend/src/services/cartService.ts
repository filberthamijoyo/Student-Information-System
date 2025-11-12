import { prisma } from '../config/prisma';
import { ValidationError } from '../utils/errors';

/**
 * Shopping Cart Service
 * Business logic for managing shopping cart
 */

/**
 * Get user's shopping cart for a specific term
 */
export async function getUserCart(userId: number, termId?: number) {
  const where: any = { userId };

  if (termId) {
    where.termId = termId;
  }

  const cartItems = await prisma.shoppingCart.findMany({
    where,
    include: {
      course: {
        include: {
          instructor: {
            select: {
              id: true,
              fullName: true,
            },
          },
          timeSlots: true,
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      },
      term: true,
    },
    orderBy: {
      addedAt: 'desc',
    },
  });

  return cartItems;
}

/**
 * Add course to shopping cart
 */
export async function addToCart(userId: number, courseId: number, termId: number, notes?: string) {
  // Check if course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new ValidationError('Course not found');
  }

  // Check if term exists
  const term = await prisma.term.findUnique({
    where: { id: termId },
  });

  if (!term) {
    throw new ValidationError('Term not found');
  }

  // Check if already in cart
  const existing = await prisma.shoppingCart.findUnique({
    where: {
      userId_courseId_termId: {
        userId,
        courseId,
        termId,
      },
    },
  });

  if (existing) {
    throw new ValidationError('Course is already in your shopping cart');
  }

  // Check if already enrolled
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId,
      status: {
        in: ['CONFIRMED', 'WAITLISTED', 'PENDING'],
      },
    },
  });

  if (enrollment) {
    throw new ValidationError('You are already enrolled in this course');
  }

  // Add to cart
  const cartItem = await prisma.shoppingCart.create({
    data: {
      userId,
      courseId,
      termId,
      notes,
    },
    include: {
      course: {
        include: {
          instructor: {
            select: {
              id: true,
              fullName: true,
            },
          },
          timeSlots: true,
        },
      },
      term: true,
    },
  });

  return cartItem;
}

/**
 * Remove course from shopping cart
 */
export async function removeFromCart(userId: number, cartItemId: number) {
  const cartItem = await prisma.shoppingCart.findUnique({
    where: { id: cartItemId },
  });

  if (!cartItem) {
    throw new ValidationError('Cart item not found');
  }

  if (cartItem.userId !== userId) {
    throw new ValidationError('Unauthorized to remove this cart item');
  }

  await prisma.shoppingCart.delete({
    where: { id: cartItemId },
  });

  return { success: true };
}

/**
 * Clear all items from user's cart for a specific term
 */
export async function clearCart(userId: number, termId?: number) {
  const where: any = { userId };

  if (termId) {
    where.termId = termId;
  }

  const result = await prisma.shoppingCart.deleteMany({
    where,
  });

  return { deletedCount: result.count };
}

/**
 * Update cart item notes
 */
export async function updateCartItemNotes(userId: number, cartItemId: number, notes: string) {
  const cartItem = await prisma.shoppingCart.findUnique({
    where: { id: cartItemId },
  });

  if (!cartItem) {
    throw new ValidationError('Cart item not found');
  }

  if (cartItem.userId !== userId) {
    throw new ValidationError('Unauthorized to update this cart item');
  }

  const updated = await prisma.shoppingCart.update({
    where: { id: cartItemId },
    data: { notes },
    include: {
      course: {
        include: {
          instructor: {
            select: {
              id: true,
              fullName: true,
            },
          },
          timeSlots: true,
        },
      },
      term: true,
    },
  });

  return updated;
}

/**
 * Get cart summary (total credits, course count, etc.)
 */
export async function getCartSummary(userId: number, termId?: number) {
  const where: any = { userId };

  if (termId) {
    where.termId = termId;
  }

  const cartItems = await prisma.shoppingCart.findMany({
    where,
    include: {
      course: {
        select: {
          credits: true,
        },
      },
    },
  });

  const totalCredits = cartItems.reduce((sum, item) => sum + item.course.credits, 0);
  const courseCount = cartItems.length;

  return {
    courseCount,
    totalCredits,
  };
}
