import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Redis Client Configuration
 */
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
};

/**
 * Create Redis Client
 */
export const redisClient = new Redis(redisConfig);

/**
 * Redis Event Handlers
 */
redisClient.on('connect', () => {
  console.log('✓ Connected to Redis');
});

redisClient.on('ready', () => {
  console.log('✓ Redis client is ready');
});

redisClient.on('error', (err) => {
  console.error('✗ Redis Client Error:', err);
});

redisClient.on('close', () => {
  console.log('Redis connection closed');
});

redisClient.on('reconnecting', () => {
  console.log('Redis client is reconnecting...');
});

/**
 * Cache key prefixes for organization
 */
export const CACHE_KEYS = {
  USER: 'user:',
  COURSE: 'course:',
  ENROLLMENT: 'enrollment:',
  SESSION: 'session:',
  RATE_LIMIT: 'rate_limit:',
  WAITLIST: 'waitlist:',
} as const;

/**
 * Cache TTL (Time To Live) in seconds
 */
export const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  DAY: 86400,      // 24 hours
} as const;

/**
 * Helper function to get cached data
 */
export const getCached = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis GET error:', error);
    return null;
  }
};

/**
 * Helper function to set cached data
 */
export const setCached = async (
  key: string,
  value: any,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<boolean> => {
  try {
    await redisClient.setex(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Redis SET error:', error);
    return false;
  }
};

/**
 * Helper function to delete cached data
 */
export const deleteCached = async (key: string): Promise<boolean> => {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Redis DEL error:', error);
    return false;
  }
};

/**
 * Helper function to delete cached data by pattern
 */
export const deleteCachedPattern = async (pattern: string): Promise<number> => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      return await redisClient.del(...keys);
    }
    return 0;
  } catch (error) {
    console.error('Redis pattern delete error:', error);
    return 0;
  }
};

/**
 * Test Redis connection
 */
export const testRedisConnection = async (): Promise<boolean> => {
  try {
    const pong = await redisClient.ping();
    console.log('Redis connection test successful:', pong);
    return pong === 'PONG';
  } catch (error) {
    console.error('Redis connection test failed:', error);
    return false;
  }
};

/**
 * Close Redis connection
 */
export const closeRedis = async () => {
  await redisClient.quit();
  console.log('Redis connection closed');
};

export default redisClient;
