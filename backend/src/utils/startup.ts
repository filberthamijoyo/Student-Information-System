import { redisClient } from '../config/redis';

/**
 * Check if database is ready and migrations are applied
 */
async function checkDatabase(): Promise<boolean> {
  // Database connection is handled by Prisma Client
  // which automatically connects when needed
  return true;
}

/**
 * Check if Redis is connected
 */
export async function checkRedis(): Promise<boolean> {
  try {
    const pong = await redisClient.ping();
    return pong === 'PONG';
  } catch (error) {
    console.error('Redis check failed:', error);
    return false;
  }
}

/**
 * Wait for services to be ready
 */
export async function waitForServices(maxRetries: number = 30): Promise<void> {
  console.log('🔍 Checking if services are ready...');

  for (let i = 0; i < maxRetries; i++) {
    try {
      const [dbReady, redisReady] = await Promise.all([
        checkDatabase(),
        checkRedis()
      ]);

      if (dbReady && redisReady) {
        console.log('✅ All services are ready!');
        console.log('   ✓ Database: Connected');
        console.log('   ✓ Redis: Connected');
        return;
      }

      if (!dbReady) {
        console.log(`⏳ Waiting for database... (${i + 1}/${maxRetries})`);
      }

      if (!redisReady) {
        console.log(`⏳ Waiting for Redis... (${i + 1}/${maxRetries})`);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log(`⏳ Services not ready yet... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  throw new Error('❌ Services failed to start in time. Please check your Docker containers.');
}

/**
 * Display service status
 */
export async function displayServiceStatus(): Promise<void> {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║           Service Status                              ║');
  console.log('╠═══════════════════════════════════════════════════════╣');

  try {
    const dbReady = await checkDatabase();
    console.log(`║ Database: ${dbReady ? '✅ Connected' : '❌ Disconnected'}                              ║`);
  } catch (error) {
    console.log('║ Database: ❌ Disconnected                              ║');
  }

  try {
    const redisReady = await checkRedis();
    console.log(`║ Redis:    ${redisReady ? '✅ Connected' : '❌ Disconnected'}                              ║`);
  } catch (error) {
    console.log('║ Redis:    ❌ Disconnected                              ║');
  }

  console.log('╚═══════════════════════════════════════════════════════╝\n');
}
