import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { AppError } from '../utils/errors';

/**
 * Get financial account for the authenticated user
 */
export async function getAccount(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    let account = await prisma.financialAccount.findUnique({
      where: { userId },
    });

    // Create account if it doesn't exist
    if (!account) {
      account = await prisma.financialAccount.create({
        data: { userId },
      });
    }

    res.json({
      success: true,
      data: {
        balance: account.balance,
        tuitionDue: account.tuitionDue,
        housingDue: account.housingDue,
        otherDue: account.otherDue,
        totalDue: account.tuitionDue + account.housingDue + account.otherDue,
        lastUpdated: account.lastUpdated,
      },
    });
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch account',
    });
  }
}

/**
 * Get all charges for the authenticated user
 */
export async function getCharges(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const account = await prisma.financialAccount.findUnique({
      where: { userId },
      include: {
        charges: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!account) {
      return res.json({
        success: true,
        data: [],
      });
    }

    res.json({
      success: true,
      data: account.charges.map(charge => ({
        id: charge.id,
        type: charge.type,
        description: charge.description,
        amount: charge.amount,
        dueDate: charge.dueDate,
        isPaid: charge.isPaid,
        semester: charge.semester,
        year: charge.year,
        createdAt: charge.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get charges error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch charges',
    });
  }
}

/**
 * Get payment history for the authenticated user
 */
export async function getPayments(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const account = await prisma.financialAccount.findUnique({
      where: { userId },
      include: {
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!account) {
      return res.json({
        success: true,
        data: [],
      });
    }

    res.json({
      success: true,
      data: account.payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        method: payment.method,
        referenceNumber: payment.referenceNumber,
        status: payment.status,
        processedAt: payment.processedAt,
        createdAt: payment.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
    });
  }
}

/**
 * Make a payment
 */
export async function makePayment(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { amount, method, referenceNumber } = req.body;

    if (!amount || !method || !referenceNumber) {
      throw new AppError('Amount, method, and reference number are required', 400);
    }

    if (amount <= 0) {
      throw new AppError('Amount must be greater than 0', 400);
    }

    const account = await prisma.financialAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      throw new AppError('Financial account not found', 404);
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        accountId: account.id,
        amount: parseFloat(amount),
        method,
        referenceNumber,
        status: 'PENDING',
      },
    });

    // In a real system, this would integrate with a payment processor
    // For now, we'll just mark it as completed after creation
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });

    // Update account balance
    await prisma.financialAccount.update({
      where: { id: account.id },
      data: {
        balance: {
          increment: parseFloat(amount),
        },
      },
    });

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        paymentId: updatedPayment.id,
        amount: updatedPayment.amount,
        status: updatedPayment.status,
        referenceNumber: updatedPayment.referenceNumber,
        processedAt: updatedPayment.processedAt,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      console.error('Make payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process payment',
      });
    }
  }
}

/**
 * Get billing statement for a specific term
 */
export async function getStatement(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { semester, year } = req.params;

    if (!semester || !year) {
      throw new AppError('Semester and year are required', 400);
    }

    const account = await prisma.financialAccount.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            student: {
              select: {
                studentId: true,
                major: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        charges: {
          where: {
            semester: semester as any,
            year: parseInt(year),
          },
        },
        payments: {
          where: {
            createdAt: {
              gte: new Date(`${year}-01-01`),
              lte: new Date(`${year}-12-31`),
            },
          },
        },
      },
    });

    if (!account) {
      throw new AppError('Account not found', 404);
    }

    const totalCharges = account.charges.reduce((sum, charge) => sum + charge.amount, 0);
    const totalPayments = account.payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, payment) => sum + payment.amount, 0);

    res.json({
      success: true,
      data: {
        student: {
          name: account.user.fullName,
          studentId: account.user.student?.studentId,
          email: account.user.email,
          major: account.user.student?.major?.name,
        },
        term: {
          semester,
          year: parseInt(year),
        },
        charges: account.charges,
        payments: account.payments,
        summary: {
          totalCharges,
          totalPayments,
          balance: totalCharges - totalPayments,
        },
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      console.error('Get statement error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statement',
      });
    }
  }
}

/**
 * Get unpaid charges
 */
export async function getUnpaidCharges(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const account = await prisma.financialAccount.findUnique({
      where: { userId },
      include: {
        charges: {
          where: {
            isPaid: false,
          },
          orderBy: {
            dueDate: 'asc',
          },
        },
      },
    });

    if (!account) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const totalUnpaid = account.charges.reduce((sum, charge) => sum + charge.amount, 0);

    res.json({
      success: true,
      data: {
        charges: account.charges,
        totalUnpaid,
      },
    });
  } catch (error) {
    console.error('Get unpaid charges error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unpaid charges',
    });
  }
}
