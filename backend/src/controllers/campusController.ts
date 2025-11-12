import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { AppError } from '../utils/errors';

/**
 * Get all active announcements for the authenticated user
 */
export async function getAnnouncements(req: AuthRequest, res: Response) {
  try {
    const user = req.user!;

    const now = new Date();

    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        publishDate: { lte: now },
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: now } },
        ],
      },
      include: {
        author: {
          select: {
            fullName: true,
            role: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { publishDate: 'desc' },
      ],
    });

    // Filter based on target audience
    const filteredAnnouncements = announcements.filter(announcement => {
      const targetAudience = announcement.targetAudience as string[];
      return targetAudience.includes('ALL') || targetAudience.includes(user.role);
    });

    res.json({
      success: true,
      data: filteredAnnouncements.map(a => ({
        id: a.id,
        title: a.title,
        content: a.content,
        type: a.type,
        priority: a.priority,
        publishDate: a.publishDate,
        expiryDate: a.expiryDate,
        author: a.author.fullName,
        attachments: a.attachments,
      })),
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements',
    });
  }
}

/**
 * Get a specific announcement
 */
export async function getAnnouncement(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const announcement = await prisma.announcement.findUnique({
      where: { id: parseInt(id) },
      include: {
        author: {
          select: {
            fullName: true,
            role: true,
          },
        },
      },
    });

    if (!announcement) {
      throw new AppError('Announcement not found', 404);
    }

    res.json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      console.error('Get announcement error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch announcement',
      });
    }
  }
}

/**
 * Get all public events
 */
export async function getEvents(req: AuthRequest, res: Response) {
  try {
    const { category, startDate, endDate } = req.query;

    const where: any = {
      isPublic: true,
    };

    if (category) {
      where.category = category;
    }

    if (startDate) {
      where.startTime = {
        gte: new Date(startDate as string),
      };
    }

    if (endDate) {
      where.endTime = {
        lte: new Date(endDate as string),
      };
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: {
        startTime: 'asc',
      },
    });

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
    });
  }
}

/**
 * Get upcoming events
 */
export async function getUpcomingEvents(req: AuthRequest, res: Response) {
  try {
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30);

    const events = await prisma.event.findMany({
      where: {
        isPublic: true,
        startTime: {
          gte: now,
          lte: thirtyDaysLater,
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      take: 10,
    });

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming events',
    });
  }
}

/**
 * Register for an event (placeholder)
 */
export async function registerForEvent(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
    });

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (event.capacity && event.registered >= event.capacity) {
      throw new AppError('Event is full', 400);
    }

    // In a full implementation, we'd create an EventRegistration model
    // For now, just increment the registered count
    await prisma.event.update({
      where: { id: parseInt(id) },
      data: {
        registered: {
          increment: 1,
        },
      },
    });

    res.json({
      success: true,
      message: 'Successfully registered for event',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      console.error('Register for event error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register for event',
      });
    }
  }
}
