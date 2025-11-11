# Tasks for Claude Code

## Current Status ✅
- Database: Supabase PostgreSQL with Prisma
- Redis: Running on localhost:6379
- Backend API: Running on port 5006
- Worker: Processing enrollment queue successfully
- Frontend: Running on port 5173, login works

## Issues to Fix 🔧

### 1. Enrollment API Endpoints (Priority: HIGH)
**Problem:** 
- Frontend gets 404 on `/api/enrollments/status/:jobId`
- Frontend gets 400 on POST `/api/enrollments`

**What's Working:**
- Worker logs show enrollment processing successfully
- Database transactions complete
- Job ID: 1 was processed and user enrolled

**What to Check:**
- `/backend/src/routes/enrollmentRoutes.ts` - Verify status endpoint exists
- `/backend/src/controllers/enrollmentController.ts` - Check getJobStatus function
- Frontend API call format in `/frontend/src/components/CourseCard.tsx`

### 2. My Enrollments Page (Priority: HIGH)
**Problem:** Page doesn't load or show enrolled courses

**What to Check:**
- `/frontend/src/pages/MyEnrollments.tsx`
- API endpoint `/api/enrollments/my-courses`
- Backend controller for fetching user enrollments

### 3. Test These Flows
After fixing:
1. Enroll in CSC3170 → Should show "Enrolled!" 
2. Check My Enrollments → Should display CSC3170
3. Try enrolling in DDA3020 → Should block (missing prerequisites)
4. Drop CSC3170 → Should work

## Environment Setup
```bash
# Backend runs on port 5006 (not 5000 - macOS ControlCenter uses it)
# Frontend expects: VITE_API_URL=http://localhost:5006/api

# Database: Supabase (check .env for DATABASE_URL)
# Redis: localhost:6379

# Demo user credentials:
# User ID: 120090001
# Password: Password123!
```

## Notes
- Prisma schema is at `/prisma/schema.prisma` (project root, NOT /backend/prisma)
- Worker is successfully processing jobs (see worker terminal output)
- The issue is frontend<->backend API contract mismatch
