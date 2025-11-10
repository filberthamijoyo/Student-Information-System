import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { testConnection, closePool } from './config/database';
import { testRedisConnection, closeRedis } from './config/redis';
import { setupEnrollmentWorker, shutdownWorker } from './workers/enrollmentWorker';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

// Import routes
import authRoutes from './routes/authRoutes';
import courseRoutes from './routes/courseRoutes';
import enrollmentRoutes from './routes/enrollmentRoutes';
import adminRoutes from './routes/adminRoutes';
import instructorRoutes from './routes/instructorRoutes';

// Load environment variables
dotenv.config();

// Create Express application
const app: Application = express();
const PORT = process.env.PORT || 5000;

/**
 * Middleware Configuration
 */

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all routes
app.use(apiLimiter);

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next) => {
    console.log(`${req.method} ${req.path}`, {
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  });
}

/**
 * Routes
 */

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const dbConnected = await testConnection();
  const redisConnected = await testRedisConnection();

  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    services: {
      database: dbConnected ? 'connected' : 'disconnected',
      redis: redisConnected ? 'connected' : 'disconnected',
      queue: 'active',
    },
  });
});

// API info endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'CUHK Course Selection System API',
    version: '1.0.0',
    description: 'Backend API for course selection and enrollment management',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      courses: '/api/courses',
      enrollments: '/api/enrollments',
      admin: '/api/admin',
      instructor: '/api/instructor',
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/instructor', instructorRoutes);

/**
 * Error Handling Middleware
 */

// 404 Not Found handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

/**
 * Server Startup
 */
const startServer = async () => {
  try {
    // Test database connection
    console.log('Testing database connection...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }

    // Test Redis connection
    console.log('Testing Redis connection...');
    const redisConnected = await testRedisConnection();
    if (!redisConnected) {
      console.warn('⚠ Warning: Redis connection failed. Continuing without cache.');
    }

    // Setup enrollment queue worker
    console.log('Setting up enrollment worker...');
    setupEnrollmentWorker();

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`✓ Server started successfully`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ API URL: http://localhost:${PORT}`);
      console.log('='.repeat(50));
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} signal received. Starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        console.log('✓ HTTP server closed');

        try {
          // Close enrollment worker
          await shutdownWorker();

          // Close database pool
          await closePool();

          // Close Redis connection
          await closeRedis();

          console.log('✓ All services shut down gracefully');
          process.exit(0);
        } catch (error) {
          console.error('✗ Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error('✗ Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      console.error('✗ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      console.error('✗ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
