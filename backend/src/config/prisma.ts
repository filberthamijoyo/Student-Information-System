import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Test connection
prisma.$connect()
  .then(() => console.log('✅ Prisma connected to database'))
  .catch((e) => console.error('❌ Prisma connection error:', e));

export default prisma;