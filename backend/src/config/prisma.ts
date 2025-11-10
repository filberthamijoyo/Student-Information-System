import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Configuration
 * Singleton pattern to prevent multiple instances in development
 */

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Gracefully disconnect on application shutdown
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await disconnectPrisma();
});

export default prisma;
