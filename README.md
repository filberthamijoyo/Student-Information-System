# CUHK Course Selection System

A production-ready course enrollment system built for CUHK-Shenzhen that handles **concurrent course registration at scale** (1000+ students simultaneously). This system demonstrates advanced database concepts and software engineering practices for a Database Systems course project.

## 🎯 Project Overview

### Key Technical Challenge
Handle 1000+ students trying to enroll in the same course simultaneously **without data corruption or overbooking**.

### Core Features
✅ **Concurrency Control**
- Queue-based enrollment with Bull + Redis
- Optimistic locking using version fields
- Database transactions with SERIALIZABLE isolation
- Prevents race conditions and overbooking

✅ **Advanced Business Logic**
- Prerequisite validation
- Time conflict detection
- Credit limit enforcement (max 18 credits/semester)
- Automatic waitlist management
- Waitlist promotion when seats open

✅ **Security & Performance**
- JWT authentication with refresh tokens
- Bcrypt password hashing
- Rate limiting (5 enrollment attempts/minute)
- Comprehensive audit logging
- Database indexes for query optimization

---

## 🏗️ Tech Stack

### Backend
- **Runtime:** Node.js 20+ with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL with Prisma ORM
- **Cache + Queue:** Redis + Bull
- **Authentication:** JWT + Bcrypt

### Frontend
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS v3
- **State Management:** React Query + Context API
- **Routing:** React Router v6

### Database Design
- **Users** (students, instructors, administrators)
- **Courses** with capacity tracking and version control
- **TimeSlots** for schedule management
- **Enrollments** with status tracking
- **AuditLogs** for complete action history

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Redis 7+

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database and Redis credentials

# Generate Prisma Client
npx prisma generate

# Push schema and seed data
npx prisma db push
npx prisma db seed

# Start backend
npm run dev

# In separate terminal, start worker
npm run worker
```

Backend runs on: `http://localhost:5000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start dev server
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

## 🎓 Demo Credentials

| Role          | User ID      | Password      |
|---------------|--------------|---------------|
| Student       | 120090001    | Password123!  |
| Instructor    | inst001      | Password123!  |
| Administrator | admin001     | Password123!  |

### Sample Courses (24 total)
- **CSC3170** - Database System (170 seats)
- **DDA3020** - Machine Learning (150 seats)
- **ECO2011** - Basic Microeconomics (200 seats)
- And 21 more...

---

## 🔧 Key Implementation Details

### Enrollment Flow with Concurrency Control

```typescript
// 1. Queue enrollment request
const job = await enrollmentQueue.add({
  userId,
  courseId,
  timestamp: new Date()
});

// 2. Worker processes with transaction + optimistic locking
await prisma.$transaction(async (tx) => {
  // Lock course with version check
  const course = await tx.course.findUnique({
    where: { id: courseId }
  });

  // Validate prerequisites, time conflicts, credit limits
  // ...

  // Update with optimistic locking
  const updated = await tx.course.updateMany({
    where: {
      id: courseId,
      version: course.version  // Key for concurrency control
    },
    data: {
      currentEnrollment: { increment: 1 },
      version: { increment: 1 }
    }
  });

  if (updated.count === 0) {
    throw new Error('Concurrent modification detected');
  }

  // Create enrollment record
  await tx.enrollment.create({
    data: { userId, courseId, status: 'CONFIRMED' }
  });
}, {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable
});
```

---

## 📊 API Endpoints

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/refresh
```

### Courses
```
GET    /api/courses
GET    /api/courses/:id
GET    /api/courses/search?q=keyword
GET    /api/courses/departments
```

### Enrollments
```
POST   /api/enrollments
GET    /api/enrollments/my-courses
GET    /api/enrollments/status/:jobId
DELETE /api/enrollments/:id
GET    /api/enrollments/waitlist/:courseId
```

---

## 🎯 Database Concepts Demonstrated

1. **ACID Transactions**: All enrollment operations atomic
2. **Isolation Levels**: SERIALIZABLE for critical operations
3. **Optimistic Locking**: Version field prevents lost updates
4. **Referential Integrity**: Foreign keys with cascades
5. **Indexes**: Strategic indexing for performance
6. **Query Optimization**: Efficient joins and aggregations
7. **Normalized Schema**: Third normal form (3NF)
8. **Concurrent Access Control**: Queue + locks

---

## 🏁 Production Deployment

### Environment Variables

**Backend**
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=your-secret-key
NODE_ENV=production
```

**Frontend**
```env
VITE_API_URL=https://api.example.com/api
```

### Recommended Services
- **Database**: Supabase, Railway, AWS RDS
- **Redis**: Upstash, Redis Cloud
- **Backend**: Railway, Render, AWS
- **Frontend**: Vercel, Netlify

---

## 🐛 Troubleshooting

**Database connection failed**
```bash
pg_isready
echo $DATABASE_URL
```

**Redis connection failed**
```bash
redis-cli ping  # Should return PONG
```

**Prisma Client issues**
```bash
npx prisma generate
```

---

## 📚 Project Structure

```
cuhk-course-selection/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     # Complete database schema
│   │   └── seed.ts           # 50+ courses, 50+ users
│   ├── src/
│   │   ├── services/         # Business logic
│   │   ├── controllers/      # HTTP handlers
│   │   ├── middleware/       # Auth, rate limiting
│   │   ├── workers/          # Queue processor
│   │   └── config/           # Prisma, Redis, Queue
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── services/         # API layer
│   │   ├── context/          # Auth state
│   │   ├── pages/            # Login, Dashboard
│   │   └── App.tsx           # Routing setup
│   └── package.json
└── README.md
```

---

## 📝 License

MIT License

---

**Built for Database Systems Course @ CUHK-Shenzhen**

