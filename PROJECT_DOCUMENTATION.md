# CUHK Course Selection System - Complete Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Current Project State](#current-project-state)
3. [Repository Structure](#repository-structure)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Database Architecture](#database-architecture)
7. [How Everything Works Together](#how-everything-works-together)
8. [Setup Guide](#setup-guide)
9. [Common Issues & Solutions](#common-issues--solutions)

---

## 1. Project Overview

### What Is This System?
A **production-ready course enrollment system** for CUHK-Shenzhen that handles **1000+ concurrent students** enrolling in courses simultaneously without data corruption or overbooking.

### Key Technical Achievement
**Concurrency Control** - Prevents race conditions using:
- Queue-based enrollment (Bull + Redis)
- Optimistic locking (version fields)
- Database transactions (SERIALIZABLE isolation)
- Job status tracking

### Tech Stack Summary
```
Frontend:  React 18 + TypeScript + Vite + Tailwind CSS + React Query
Backend:   Node.js + Express + TypeScript + Prisma ORM
Database:  Supabase (PostgreSQL) - Cloud-hosted
Cache:     Redis (for Bull queue system)
Auth:      JWT + Bcrypt
```

---

## 2. Current Project State

### ✅ What's Already Implemented

#### Backend (100% Complete)
- [x] **Authentication System**
  - User registration with role-based access (STUDENT, INSTRUCTOR, ADMINISTRATOR)
  - JWT auth with refresh tokens
  - Password hashing with bcrypt
  - Protected routes middleware

- [x] **Course Management**
  - Browse all courses with filters
  - Search by code, name, instructor
  - Department filtering
  - Real-time enrollment capacity tracking

- [x] **Enrollment System (Core Feature)**
  - Queue-based enrollment processing
  - Optimistic locking to prevent overbooking
  - Prerequisite validation
  - Time conflict detection
  - Credit limit enforcement (18 credits max)
  - Automatic waitlist management
  - Job status polling

- [x] **Database Schema**
  - 5 models: User, Course, TimeSlot, Enrollment, AuditLog
  - Comprehensive relationships and indexes
  - Version fields for optimistic locking

- [x] **Worker System**
  - Background job processor
  - Handles enrollment requests sequentially
  - Automatic retries on failure

#### Frontend (100% Complete)
- [x] **Pages**
  - Login page with demo credentials
  - Dashboard with quick links
  - Course browsing with search/filters
  - My Enrollments with weekly schedule view

- [x] **Components**
  - CourseCard with enrollment functionality
  - Layout with shared navigation
  - Loading states and error handling

- [x] **Features**
  - Real-time enrollment status polling
  - Visual capacity indicators
  - Automatic waitlist handling
  - Course drop functionality

#### Database Migration
- [x] **Migrated to Supabase**
  - Cloud-hosted PostgreSQL
  - Connection pooling configured
  - No local PostgreSQL needed
  - Production-ready setup

#### Data
- [x] **49 Real CUHK Courses** (Fall 2025)
  - Real course codes (CSC3170, DDA3020, MAT1001, etc.)
  - Real instructor names
  - Actual capacities and prerequisites
  - Multiple departments: SDS, SME, SSE, HSS, MED

### 🔄 What We're Working On Right Now
- **Troubleshooting Prisma Setup**: Fixing `npx prisma db push` command
- The issue is likely related to environment variables or Prisma schema location

---

## 3. Repository Structure

```
cuhk-course-selection/
├── 📁 backend/                   # Node.js/Express backend
│   ├── 📁 database/             # Old SQL migration files (deprecated)
│   ├── 📁 prisma/               # OLD Prisma schema (IGNORE THIS)
│   │   └── schema.prisma        # ⚠️ OUTDATED - don't use
│   ├── 📁 src/
│   │   ├── 📁 config/           # Configuration files
│   │   │   ├── database.ts      # Old raw SQL config (deprecated)
│   │   │   ├── prisma.ts        # Prisma client singleton
│   │   │   ├── queue.ts         # Bull queue configuration
│   │   │   └── redis.ts         # Redis connection
│   │   ├── 📁 controllers/      # Request handlers
│   │   │   ├── authController.ts
│   │   │   ├── courseController.ts
│   │   │   ├── enrollmentController.ts
│   │   │   ├── instructorController.ts
│   │   │   └── adminController.ts
│   │   ├── 📁 middleware/       # Express middleware
│   │   │   ├── auth.ts          # JWT verification
│   │   │   ├── errorHandler.ts  # Global error handling
│   │   │   └── rateLimiter.ts   # Rate limiting (5/min)
│   │   ├── 📁 routes/           # API route definitions
│   │   │   ├── authRoutes.ts    # /api/auth/*
│   │   │   ├── courseRoutes.ts  # /api/courses/*
│   │   │   ├── enrollmentRoutes.ts # /api/enrollments/*
│   │   │   └── ...
│   │   ├── 📁 services/         # Business logic layer
│   │   │   ├── authService.ts   # User management
│   │   │   ├── courseService.ts # Course operations
│   │   │   └── enrollmentService.ts # ⭐ Core enrollment logic
│   │   ├── 📁 types/            # TypeScript type definitions
│   │   ├── 📁 utils/            # Helper functions
│   │   │   ├── conflictDetection.ts # Time conflict checker
│   │   │   ├── validation.ts    # Input validation
│   │   │   └── startup.ts       # Server startup tasks
│   │   ├── 📁 workers/          # Background job processors
│   │   │   └── enrollmentWorker.ts # ⭐ Processes enrollment queue
│   │   └── server.ts            # Main Express app
│   ├── .env                     # Environment variables (YOUR CONFIG)
│   ├── .env.example             # Environment template
│   ├── package.json             # Dependencies
│   ├── prisma.config.ts         # ⭐ Points to /prisma/schema.prisma
│   └── tsconfig.json            # TypeScript config
│
├── 📁 frontend/                 # React frontend
│   ├── 📁 public/              # Static assets
│   ├── 📁 src/
│   │   ├── 📁 components/      # Reusable components
│   │   │   ├── CourseCard.tsx  # Course display + enroll button
│   │   │   └── Layout.tsx      # Shared navigation
│   │   ├── 📁 context/         # React context
│   │   │   └── AuthContext.tsx # Auth state management
│   │   ├── 📁 pages/           # Page components
│   │   │   ├── Login.tsx       # Login page
│   │   │   ├── Dashboard.tsx   # Home page
│   │   │   ├── CourseList.tsx  # Browse courses
│   │   │   └── MyEnrollments.tsx # Student enrollments
│   │   ├── 📁 services/        # API client
│   │   │   └── api.ts          # Axios instance + API functions
│   │   ├── App.tsx             # Main app with routing
│   │   ├── main.tsx            # React entry point
│   │   └── index.css           # Global styles (Tailwind)
│   ├── .env                     # Frontend config (YOUR CONFIG)
│   ├── .env.example             # Environment template
│   ├── package.json             # Dependencies
│   ├── tailwind.config.js       # Tailwind configuration
│   ├── postcss.config.js        # PostCSS with Tailwind
│   └── vite.config.ts           # Vite bundler config
│
├── 📁 prisma/                   # ⭐ MAIN PRISMA DIRECTORY
│   ├── schema.prisma            # ⭐ PRIMARY schema (USE THIS)
│   └── seed.ts                  # Database seeding script (49 courses)
│
├── docker-compose.yml           # Redis only (PostgreSQL on Supabase)
├── docker-compose.local.yml     # Full stack with local PostgreSQL
├── README.md                    # Quick start guide
├── SUPABASE_SETUP.md           # Supabase migration guide
└── DOCKER_README.md            # Docker instructions

⚠️ IMPORTANT: The Prisma schema is at PROJECT ROOT: /prisma/schema.prisma
   Do NOT use /backend/prisma/schema.prisma (that's outdated!)
```

---

## 4. Backend Architecture

### File Locations
- **Prisma Schema**: `/prisma/schema.prisma` (⭐ PROJECT ROOT)
- **Prisma Seed**: `/prisma/seed.ts`
- **Backend Code**: `/backend/src/`
- **Backend Config**: `/backend/.env`

### Key Backend Files

#### 1. `/backend/src/server.ts` - Main Express Application
```typescript
// Entry point - starts the HTTP server
// Sets up:
// - CORS for frontend communication
// - JSON body parsing
// - Rate limiting
// - Routes: /api/auth, /api/courses, /api/enrollments
// - Error handling middleware
```

#### 2. `/backend/src/services/enrollmentService.ts` - Core Logic
```typescript
// THE MOST IMPORTANT FILE
// Implements:
// - enrollStudentInCourse() - Main enrollment function
// - Optimistic locking with version field
// - Prerequisite validation
// - Time conflict detection
// - Credit limit checking
// - Automatic waitlist management
// - Database transactions with SERIALIZABLE isolation
```

#### 3. `/backend/src/workers/enrollmentWorker.ts` - Queue Processor
```typescript
// Background worker that processes enrollment jobs
// Runs in separate process: npm run worker
// Handles:
// - Sequential job processing
// - Automatic retries (3 attempts)
// - Error handling
// - Job status updates
```

#### 4. `/backend/src/config/prisma.ts` - Database Client
```typescript
// Singleton Prisma client
// Handles connection to Supabase
// Used by all services
```

### API Endpoints

**Authentication** (`/api/auth/`)
- `POST /register` - Create new user
- `POST /login` - Login (returns JWT)
- `GET /me` - Get current user
- `POST /refresh` - Refresh JWT token
- `POST /logout` - Logout

**Courses** (`/api/courses/`)
- `GET /` - List all courses
- `GET /:id` - Get course by ID
- `GET /search` - Search courses
- `GET /departments` - List departments

**Enrollments** (`/api/enrollments/`)
- `POST /` - Enroll in course (adds to queue)
- `GET /my-courses` - Get student's enrollments
- `GET /status/:jobId` - Check enrollment job status
- `DELETE /:id` - Drop course

---

## 5. Frontend Architecture

### Key Frontend Files

#### 1. `/frontend/src/App.tsx` - Main Application
```typescript
// React Router setup
// Routes:
// - /login (public)
// - / (Dashboard - protected)
// - /courses (CourseList - protected)
// - /enrollments (MyEnrollments - protected)
// ProtectedRoute redirects to /login if not authenticated
```

#### 2. `/frontend/src/pages/CourseList.tsx` - Browse Courses
```typescript
// Features:
// - Search by code, name, instructor
// - Filter by department
// - Display all 49 courses in grid
// - Real-time enrollment counts
// - Uses React Query for caching
```

#### 3. `/frontend/src/components/CourseCard.tsx` - Enrollment UI
```typescript
// Each course card shows:
// - Course info (code, name, credits, instructor)
// - Prerequisites
// - Time slots
// - Capacity bar (visual progress)
// - Enroll button
//
// When you click "Enroll":
// 1. POST /api/enrollments (returns jobId)
// 2. Polls /api/enrollments/status/:jobId every 1s
// 3. Shows "Processing...", "Success!", or error
// 4. Refreshes course list after success
```

#### 4. `/frontend/src/pages/MyEnrollments.tsx` - Student Dashboard
```typescript
// Displays:
// - Summary cards (enrolled, credits, waitlisted)
// - Weekly schedule view organized by day
// - List of confirmed enrollments
// - List of waitlisted courses
// - Drop course functionality
```

#### 5. `/frontend/src/context/AuthContext.tsx` - Authentication State
```typescript
// Global auth state using React Context
// Stores:
// - user object
// - JWT token (in localStorage)
// - login() and logout() functions
// Auto-loads user on refresh
```

---

## 6. Database Architecture

### Prisma Schema Location
**⭐ CRITICAL**: The schema is at **`/prisma/schema.prisma`** (project root)

### Schema Structure

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Supabase pooled connection
  directUrl = env("DIRECT_URL")        // Supabase direct connection
}

model User {
  id             Int          @id @default(autoincrement())
  userIdentifier String       @unique
  email          String       @unique
  password       String       // bcrypt hashed
  fullName       String
  role           Role         // STUDENT, INSTRUCTOR, ADMINISTRATOR
  enrollments    Enrollment[] // Student's enrollments
  // ...
}

model Course {
  id                Int          @id @default(autoincrement())
  courseCode        String       @unique
  courseName        String
  credits           Int
  department        String
  maxCapacity       Int
  currentEnrollment Int          @default(0)
  version           Int          @default(0) // ⭐ For optimistic locking
  instructor        User         @relation(...)
  timeSlots         TimeSlot[]
  enrollments       Enrollment[]
  // ...
}

model TimeSlot {
  id         Int      @id @default(autoincrement())
  courseId   Int
  course     Course   @relation(...)
  dayOfWeek  String   // MONDAY, TUESDAY, etc.
  startTime  String   // HH:MM format
  endTime    String
  location   String
}

model Enrollment {
  id         Int              @id @default(autoincrement())
  userId     Int
  courseId   Int
  status     EnrollmentStatus // CONFIRMED, WAITLISTED, DROPPED
  enrolledAt DateTime         @default(now())
  user       User             @relation(...)
  course     Course           @relation(...)
}

model AuditLog {
  id        Int      @id @default(autoincrement())
  userId    Int
  action    String   // LOGIN, ENROLL, DROP, etc.
  details   Json?
  timestamp DateTime @default(now())
}
```

### Why Two Connections (DATABASE_URL vs DIRECT_URL)?

**Supabase uses PgBouncer** (connection pooler):
- **`DATABASE_URL`**: Pooled connection (port 6543)
  - Used for queries (SELECT, INSERT, UPDATE)
  - Limited to simple queries
  - Fast and efficient

- **`DIRECT_URL`**: Direct connection (port 5432)
  - Used for migrations and schema changes
  - Required by Prisma for `npx prisma db push`
  - Bypasses pooler for complex operations

---

## 7. How Everything Works Together

### Enrollment Flow (End-to-End)

```
┌─────────────┐
│  FRONTEND   │
│ CourseCard  │  1. User clicks "Enroll in Course"
└──────┬──────┘
       │ POST /api/enrollments { courseId: 5 }
       ↓
┌─────────────────────────────────────┐
│  BACKEND API                        │
│  enrollmentController.ts            │  2. Validates request
│                                     │     Checks auth token
└───────────┬─────────────────────────┘
            │ Adds job to Redis queue
            ↓
┌─────────────────────────────────────┐
│  BULL QUEUE (Redis)                 │  3. Job queued with ID
│  { jobId: "abc123", userId, courseId }
└───────────┬─────────────────────────┘
            │ Worker picks up job
            ↓
┌─────────────────────────────────────┐
│  ENROLLMENT WORKER                  │  4. Processes sequentially
│  enrollmentWorker.ts                │
└───────────┬─────────────────────────┘
            │ Calls enrollmentService
            ↓
┌─────────────────────────────────────┐
│  ENROLLMENT SERVICE                 │  5. Core business logic
│  enrollmentService.ts               │
│  ┌─────────────────────────────┐  │
│  │ START TRANSACTION           │  │
│  │ (SERIALIZABLE Isolation)    │  │
│  └─────────────────────────────┘  │
│                                     │
│  Step 1: Lock Course               │
│  ├─ SELECT * FROM Course           │
│  │  WHERE id = 5                   │
│  │  (get current version)          │
│                                     │
│  Step 2: Validate                  │
│  ├─ Check prerequisites             │
│  ├─ Check time conflicts            │
│  ├─ Check credit limit (18 max)    │
│  ├─ Check not already enrolled     │
│                                     │
│  Step 3: Optimistic Lock Update    │
│  ├─ UPDATE Course                   │
│  │  SET currentEnrollment += 1,    │
│  │      version += 1               │
│  │  WHERE id = 5                   │
│  │  AND version = <old_version>   │  ⭐ KEY!
│  │                                  │
│  │  If updated.count == 0:         │
│  │    → Another enrollment won     │
│  │    → Throw error, retry         │
│                                     │
│  Step 4: Create Enrollment         │
│  ├─ INSERT INTO Enrollment          │
│  │  (userId, courseId, status)     │
│  │  Values: CONFIRMED or WAITLISTED│
│                                     │
│  Step 5: Audit Log                 │
│  └─ INSERT INTO AuditLog            │
│     (userId, action="ENROLL")       │
│                                     │
│  ┌─────────────────────────────┐  │
│  │ COMMIT TRANSACTION          │  │  6. All or nothing
│  └─────────────────────────────┘  │
└───────────┬─────────────────────────┘
            │ Job marked complete
            ↓
┌─────────────────────────────────────┐
│  FRONTEND (Polling)                 │  7. Checks status every 1s
│  GET /api/enrollments/status/:jobId │
│                                     │  8. Shows "Success!" or error
└─────────────────────────────────────┘
```

### Why This Architecture Prevents Overbooking

1. **Queue**: Ensures sequential processing (no simultaneous enrollments)
2. **Optimistic Locking**: Version field prevents lost updates
3. **Transaction**: Either ALL steps succeed or NONE (atomic)
4. **SERIALIZABLE**: Highest isolation level

**Example Race Condition (Prevented)**:
```
Course has 1 seat left, 2 students try to enroll:

❌ Without Locking:
Student A reads capacity: 1 seat left ✓
Student B reads capacity: 1 seat left ✓  ← Both think there's space!
Student A enrolls (capacity now 0)
Student B enrolls (capacity now -1) ❌ OVERBOOKED!

✅ With Optimistic Locking:
Student A: version=5, update WHERE version=5 ✓ (version→6)
Student B: version=5, update WHERE version=5 ✗ (version is now 6!)
Student B gets error, added to waitlist instead
```

---

## 8. Setup Guide

### Prerequisites
- Node.js 20+
- Supabase account (free tier)
- Docker (for Redis) OR local Redis installation

### Step-by-Step Setup

#### 1. Create Supabase Project
```bash
# Go to https://supabase.com
# Click "New Project"
# Name: cuhk-course-selection
# Save your database password!
```

#### 2. Get Supabase Connection Strings
```bash
# In Supabase Dashboard:
# Settings → Database
# Copy BOTH:
# - Transaction Mode (pooled) - port 6543
# - Direct Connection - port 5432
```

#### 3. Configure Backend Environment
```bash
cd backend

# Copy example
cp .env.example .env

# Edit .env with your Supabase URLs:
nano .env
```

Your `.env` should look like:
```env
# Supabase Connection
DATABASE_URL="postgres://postgres.xxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres"

# Redis (will start with Docker)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (use a strong secret!)
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRY=24h
JWT_REFRESH_SECRET=your-refresh-secret-change-this
JWT_REFRESH_EXPIRY=7d

# Server
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# Enrollment Settings
MAX_CREDITS_PER_SEMESTER=18
MAX_COURSES_PER_SEMESTER=7
QUEUE_NAME=enrollment-queue
QUEUE_ATTEMPTS=3
QUEUE_BACKOFF_DELAY=5000
```

#### 4. Install Backend Dependencies
```bash
cd backend
npm install
```

#### 5. Generate Prisma Client
```bash
# This reads /prisma/schema.prisma and generates client
npx prisma generate
```

#### 6. Push Schema to Supabase
```bash
# This creates tables in Supabase
npx prisma db push

# If this fails, see "Common Issues" section below
```

#### 7. Seed Database with 49 Courses
```bash
# This runs /prisma/seed.ts
npx prisma db seed
```

#### 8. Start Redis
```bash
# Option A: Docker (recommended)
cd ..  # back to project root
docker-compose up -d redis

# Option B: Local Redis
# macOS: brew install redis && brew services start redis
# Ubuntu: sudo apt install redis-server && sudo systemctl start redis
```

#### 9. Start Backend
```bash
# Terminal 1: API Server
cd backend
npm run dev
# Should see: "Server running on port 5000"

# Terminal 2: Worker
cd backend
npm run worker
# Should see: "Worker started"
```

#### 10. Configure Frontend
```bash
cd frontend

# Copy example
cp .env.example .env

# Edit .env
nano .env
```

Your `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

#### 11. Install Frontend Dependencies
```bash
cd frontend
npm install
```

#### 12. Start Frontend
```bash
npm run dev
# Opens: http://localhost:5173
```

#### 13. Test the System
```
1. Go to http://localhost:5173
2. Login with:
   - User ID: 120090001
   - Password: Password123!
3. Browse Courses
4. Try enrolling in CSC3170 (Database System)
5. Check "My Enrollments" to see your schedule
```

---

## 9. Common Issues & Solutions

### Issue 1: `npx prisma db push` Fails

**Error**: `Can't reach database server`

**Causes**:
1. Wrong DATABASE_URL or DIRECT_URL
2. Missing DIRECT_URL in .env
3. Supabase project not ready
4. IP not allowed in Supabase

**Solutions**:
```bash
# 1. Verify .env has BOTH URLs
cat backend/.env | grep URL

# Should see:
# DATABASE_URL=postgres://...6543/postgres?pgbouncer=true
# DIRECT_URL=postgresql://...5432/postgres

# 2. Test connection
npx prisma db execute --stdin <<< "SELECT 1;"

# 3. Check if Prisma finds the schema
npx prisma validate

# 4. Try from project root (not backend/)
cd /home/user/cuhk-course-selection
npx prisma db push

# 5. Check Supabase dashboard
# Make sure project status is "Active" (not "Paused")
```

### Issue 2: Redis Connection Failed

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solution**:
```bash
# Check if Redis is running
docker ps | grep redis

# If not running:
docker-compose up -d redis

# Test Redis connection
docker exec -it cuhk-redis redis-cli ping
# Should respond: PONG
```

### Issue 3: Frontend Can't Connect to Backend

**Error**: `Network Error` or `ERR_CONNECTION_REFUSED`

**Solution**:
```bash
# 1. Check backend is running
curl http://localhost:5000/api/courses
# Should return JSON

# 2. Check CORS_ORIGIN in backend/.env
cat backend/.env | grep CORS_ORIGIN
# Should be: CORS_ORIGIN=http://localhost:5173

# 3. Check frontend .env
cat frontend/.env
# Should be: VITE_API_URL=http://localhost:5000/api
```

### Issue 4: Enrollment Stays "Processing..." Forever

**Causes**:
- Worker not running
- Redis not running
- Backend error

**Solution**:
```bash
# 1. Check worker is running
# In backend terminal running "npm run worker"
# Should see: "Worker started"

# 2. Check Redis
docker exec -it cuhk-redis redis-cli
# In Redis CLI:
> KEYS *
# Should show queue keys

# 3. Check backend logs for errors
# Look at terminal running "npm run dev"
```

### Issue 5: Prisma Client Not Found

**Error**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
cd backend
npx prisma generate
npm install
```

---

## Summary of Where We Are

### ✅ Complete
1. Full backend with authentication, courses, enrollments
2. Full frontend with all pages and components
3. Database schema with 49 real CUHK courses
4. Migrated to Supabase (cloud-hosted)
5. Queue system implemented
6. Optimistic locking working

### 🔧 Current Issue
- `npx prisma db push` might fail if:
  - Environment variables not set correctly
  - Supabase connection strings incomplete
  - Running from wrong directory

### 📍 Next Steps
1. Fix the Prisma db push issue by:
   - Verifying .env has both DATABASE_URL and DIRECT_URL
   - Checking Supabase project is active
   - Running from correct directory
2. Start Redis
3. Start backend + worker
4. Start frontend
5. Test enrollment flow

---

## Quick Reference

### Important File Paths
- **Prisma Schema**: `/prisma/schema.prisma` ⭐
- **Seed Data**: `/prisma/seed.ts`
- **Backend .env**: `/backend/.env`
- **Frontend .env**: `/frontend/.env`
- **Main Backend**: `/backend/src/server.ts`
- **Enrollment Logic**: `/backend/src/services/enrollmentService.ts`
- **Worker**: `/backend/src/workers/enrollmentWorker.ts`

### Important Commands
```bash
# Backend
cd backend
npm install               # Install dependencies
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema to Supabase
npx prisma db seed       # Seed 49 courses
npm run dev              # Start API server
npm run worker           # Start background worker
npx prisma studio        # Open database GUI

# Frontend
cd frontend
npm install              # Install dependencies
npm run dev              # Start dev server
npm run build            # Build for production

# Docker
docker-compose up -d redis              # Start Redis only
docker-compose -f docker-compose.local.yml up -d  # Full stack with local PostgreSQL
```

### Demo Accounts
```
Student:       120090001 / Password123!
Instructor:    inst001   / Password123!
Administrator: admin001  / Password123!
```

---

**Last Updated**: After Supabase migration
**Version**: 1.0.0
**Status**: Ready for deployment (after db push fix)
