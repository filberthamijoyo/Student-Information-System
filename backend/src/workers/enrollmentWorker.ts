import { Job } from 'bull';
import { enrollmentQueue } from '../config/queue';
import { processEnrollment } from '../services/enrollmentService';

/**
 * Enrollment Worker (Prisma-based)
 * Processes enrollment jobs from the queue
 */

/**
 * Process a single enrollment job
 */
async function handleEnrollmentJob(job: Job): Promise<any> {
  const { userId, courseId, timestamp } = job.data;

  console.log(`[Worker] Processing enrollment job ${job.id}:`, {
    userId,
    courseId,
    timestamp,
    attempt: job.attemptsMade + 1
  });

  try {
    const result = await processEnrollment(userId, courseId);

    console.log(`[Worker] ✓ Job ${job.id} completed:`, result.status);

    return result;
  } catch (error: any) {
    console.error(`[Worker] ✗ Job ${job.id} failed:`, error.message);
    throw error; // Will trigger retry based on job configuration
  }
}

/**
 * Setup enrollment queue processor
 */
export function setupEnrollmentWorker() {
  // Process jobs
  enrollmentQueue.process(async (job: Job) => {
    return await handleEnrollmentJob(job);
  });

  // Job completed
  enrollmentQueue.on('completed', (job, result) => {
    console.log(`[Worker] Job ${job.id} completed successfully:`, {
      status: result.status,
      message: result.message
    });
  });

  // Job failed
  enrollmentQueue.on('failed', (job, error) => {
    console.error(`[Worker] Job ${job.id} failed after ${job.attemptsMade} attempts:`, error.message);
  });

  // Job active
  enrollmentQueue.on('active', (job) => {
    console.log(`[Worker] Job ${job.id} started processing`);
  });

  // Queue stalled
  enrollmentQueue.on('stalled', (job) => {
    console.warn(`[Worker] Job ${job.id} stalled`);
  });

  console.log('✓ Enrollment worker started and listening for jobs');
}

/**
 * Graceful shutdown
 */
export async function shutdownWorker() {
  console.log('Shutting down enrollment worker...');
  await enrollmentQueue.close();
  console.log('✓ Enrollment worker shut down');
}

// Handle process termination
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received');
  await shutdownWorker();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received');
  await shutdownWorker();
  process.exit(0);
});

// Start worker if this file is run directly
if (require.main === module) {
  setupEnrollmentWorker();
  console.log('Enrollment worker is running. Press Ctrl+C to stop.');
}

export default setupEnrollmentWorker;
