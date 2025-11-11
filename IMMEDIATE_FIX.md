# IMMEDIATE FIX - Cannot Enroll in Courses

## Problem
You cannot enroll in any courses because the system returns "You are already enrolled in this course" even when you're not.

## Root Cause
Previous enrollment attempts (including failed ones) left REJECTED records in the database. The unique constraint on (userId, courseId) prevents new enrollment attempts.

## Quick Fix (DO THIS NOW)

### Step 1: Clear Your Enrollment Records

```bash
cd backend
npx ts-node src/scripts/clearEnrollments.ts 1
```

This will delete all enrollment records for user ID 1 (the test student).

### Step 2: Clear Stuck Jobs from Queue

```bash
cd backend
npm run queue:clear
```

This removes any stuck jobs from Redis.

### Step 3: Restart Services

Stop all running services (Ctrl+C in each terminal), then restart:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Worker:**
```bash
cd backend
npm run worker
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 4: Test Enrollment

1. Go to http://localhost:5173
2. Login with: `120090001` / `Password123!`
3. Click "Courses" in navigation
4. Try enrolling in **CSC3170** (has no prerequisites)
5. You should see:
   - "Processing enrollment..." (brief)
   - "Successfully enrolled!" (after 1-2 seconds)

### Step 5: Verify My Enrollments

1. Click "My Enrollments" in navigation
2. You should see CSC3170 listed
3. Status should show "Enrolled"

## If It Still Doesn't Work

### Check Database for Stale Records

```bash
cd backend
npx prisma studio
```

1. Open http://localhost:5555
2. Click "Enrollment" table
3. Filter by userId = 1
4. Delete any REJECTED records manually
5. Try enrolling again

### Check Worker Logs

Look for these messages in the worker terminal:

**GOOD:**
```
[Worker] Job X started processing
[Worker] ✓ Job X completed: CONFIRMED
```

**BAD (ValidationError detected correctly):**
```
[Worker] ✗ Job X failed: Missing prerequisites: CSC1001, STA2001
[Worker] ValidationError detected - failing job immediately without retry
```

**BAD (Stuck in retry loop):**
```
[Worker] ✗ Job X failed: Some error
[Worker] Job X failed after 2 attempts
[Worker] Processing enrollment job X: attempt: 3
```

### Check Frontend Console

Open browser DevTools (F12) and look for:

**GOOD:**
```
POST /api/enrollments → 202 Accepted {jobId: "123"}
GET /api/enrollments/status/123 → {status: "completed"}
```

**BAD:**
```
POST /api/enrollments → 400 Bad Request {message: "Already enrolled"}
```

## Common Scenarios and Solutions

### Scenario 1: "Missing prerequisites" error

**Expected Behavior:** Error appears within 1 second, no retries

**If retrying 3 times:**
1. Check worker logs for "ValidationError detected"
2. If not detected, the ValidationError class isn't working
3. File a bug with worker logs

**Workaround:** Complete prerequisites first:
- For DDA3020: Need CSC1001 and STA2001
- Manually add grade to enrollments in database

### Scenario 2: "Time conflict" error

**Expected Behavior:** Error appears within 1 second

**If this happens:** Your existing enrollment has overlapping time slots

**Workaround:** Drop conflicting course first

### Scenario 3: "Course is full" → Added to waitlist

**Expected Behavior:** Success message "Added to waitlist at position X"

**To test:**
1. Check course capacity in database
2. Enroll students until full
3. Next enrollment should go to waitlist

### Scenario 4: Job stuck in "Processing..."

**Expected Behavior:** Should complete within 3 seconds

**If stuck after 30 seconds:**
1. Check worker is running
2. Check Redis is running
3. Check worker logs for errors
4. Clear queue and try again

## Emergency Database Reset

If everything is broken and you want to start fresh:

```bash
# WARNING: This deletes ALL data!

cd backend

# Reset database
npx prisma migrate reset --force

# Reseed data
npm run db:seed

# Clear Redis
redis-cli FLUSHALL

# Restart services
npm run dev
```

Then login and test again.

## What I Need to Fix This Properly

To permanently fix this issue, I need you to:

1. **Test the current fix** and report back:
   - Does enrollment work now?
   - Do errors appear within 1 second?
   - Any new error messages?

2. **Send me logs** from a failed enrollment:
   - Worker terminal output
   - Backend API terminal output
   - Browser console (F12)

3. **Tell me your priority**:
   - Fix bugs first (enrollment must work)
   - Add features (admin panel, notifications)
   - Improve UI/UX
   - Write tests

4. **Fill out the PRD_TEMPLATE.md** with:
   - Which bugs are most critical to you
   - Which features you need most
   - Timeline expectations
   - Success criteria

## Next Steps

After you've tested the immediate fix:

1. Read `PROJECT_DOCUMENTATION.md` to understand the full system
2. Fill out `PRD_TEMPLATE.md` with your priorities
3. Send me the completed PRD
4. I'll create a systematic plan to fix everything

## Questions to Answer

Please answer these so I can help effectively:

1. **What's your primary goal?**
   - Get enrollment working for demo/presentation?
   - Deploy to production for real users?
   - Learn system architecture for class project?

2. **What's your timeline?**
   - Need it working today?
   - Have a week?
   - No rush, want it done right?

3. **What's most important?**
   - System must not crash (reliability)
   - Must handle many users (scalability)
   - Must be easy to use (UX)
   - Must be secure (security)

4. **Do you want me to:**
   - Fix critical bugs only?
   - Fix bugs + complete features?
   - Fix bugs + add tests?
   - Complete rewrite with better architecture?

---

**Once you answer these questions, I can create a focused plan to get you to your goal efficiently.**
