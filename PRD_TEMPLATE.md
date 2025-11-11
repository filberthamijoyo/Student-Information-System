# Product Requirements Document - CUHK Course Selection System

## Document Control
- **Version**: 1.0
- **Date Created**: 2025-11-11
- **Last Updated**: [DATE]
- **Owner**: [YOUR NAME]
- **Status**: DRAFT

---

## Executive Summary

### Project Overview
Course enrollment system for CUHK with queue-based processing, waitlist management, and real-time status updates.

### Current State
- Core infrastructure complete (backend, frontend, database, queue system)
- Authentication and course browsing working
- **CRITICAL BUGS preventing enrollment flow from working**

### Objectives for This PRD
- [ ] Fix all critical bugs blocking enrollment
- [ ] Complete enrollment user experience
- [ ] Add missing UI components
- [ ] Prepare system for production

---

## Priority 1: CRITICAL BUG FIXES (MUST DO FIRST)

### BUG-001: Cannot Enroll - "Already Enrolled" Error

**Severity**: 🔴 Critical - Blocks all enrollment functionality

**Description**:
Users cannot enroll in courses. System immediately returns "You are already enrolled in this course" even for courses they've never enrolled in.

**Root Cause**:
- Previous failed enrollment attempts leave REJECTED records in database
- Duplicate check in both `queueEnrollment()` and `processEnrollment()`
- REJECTED records not cleaned up automatically
- Unique constraint (userId, courseId) prevents new enrollment attempts

**Impact**:
- System completely non-functional for primary use case
- Users frustrated, cannot test or use system
- Requires manual database cleanup

**Requirements**:
1. **MUST** delete REJECTED enrollments before creating new ones
2. **MUST** handle REJECTED status in duplicate check logic
3. **SHOULD** add automatic cleanup of old REJECTED records (>24 hours)
4. **MUST** add logging to track why enrollments fail

**Acceptance Criteria**:
- [ ] User can enroll in a course successfully
- [ ] After enrollment fails (e.g., missing prerequisites), user can try again
- [ ] REJECTED records automatically deleted or reused
- [ ] Clear error messages for each failure type
- [ ] No manual database intervention needed

**Test Cases**:
1. Enroll in course without prerequisites → Fails with message → Try again after completing prerequisites → Success
2. Enroll in full course → Added to waitlist → Try to enroll again → Error "Already on waitlist"
3. Enroll in course successfully → Try to enroll again → Error "Already enrolled"

---

### BUG-002: Validation Errors Retry Incorrectly

**Severity**: 🔴 Critical - Poor user experience, delayed feedback

**Description**:
When enrollment fails due to business rule violations (missing prerequisites, time conflicts, etc.), the system retries 3 times before failing, causing a 10+ second delay.

**Root Cause**:
- Worker doesn't properly detect ValidationError instances
- `job.discard()` may not prevent retries correctly
- Prisma constraint errors not caught as ValidationErrors

**Impact**:
- User sees "Processing..." for 10+ seconds before error appears
- System wastes resources retrying impossible operations
- Queue clogs with failing jobs

**Requirements**:
1. **MUST** immediately fail ValidationErrors without retry
2. **MUST** return error to frontend within 1 second
3. **SHOULD** distinguish validation vs transient errors clearly
4. **MUST** log error type for debugging

**Acceptance Criteria**:
- [ ] Missing prerequisite error appears within 1 second
- [ ] Time conflict error appears within 1 second
- [ ] Already enrolled error appears within 1 second
- [ ] Worker logs show "ValidationError - no retry"
- [ ] Only database/network errors retry

**Test Cases**:
1. Enroll without prerequisites → Error within 1 second
2. Enroll with time conflict → Error within 1 second
3. Enroll when database temporarily down → Retries 3 times

---

### BUG-003: Frontend Stuck on "Processing..."

**Severity**: 🟠 High - Breaks user experience

**Description**:
Frontend polls job status but sometimes gets stuck showing "Processing..." even when job has failed.

**Root Cause**:
- Failed jobs may not transition to "failed" state correctly
- Status endpoint might return stale data
- No timeout mechanism in frontend polling

**Impact**:
- User doesn't know operation failed
- Appears broken, requires page refresh
- Confusing user experience

**Requirements**:
1. **MUST** add 30-second timeout to frontend polling
2. **MUST** ensure failed jobs show "failed" status
3. **SHOULD** show error message from job failure
4. **SHOULD** add manual "refresh status" button

**Acceptance Criteria**:
- [ ] Polling stops after 30 seconds with timeout message
- [ ] Failed enrollment shows error message within 5 seconds
- [ ] User can manually check status
- [ ] Clear "Try Again" button on errors

---

### BUG-004: Job State Management Errors

**Severity**: 🟠 High - Worker crashes

**Description**:
Worker throws error: "Job is not in active state" when trying to move job to failed state.

**Root Cause**:
- Manual `job.moveToFailed()` conflicts with Bull's internal state management
- Changed to `job.discard()` but needs verification

**Impact**:
- Worker crashes intermittently
- Jobs get stuck in queue
- Requires manual cleanup

**Requirements**:
1. **MUST** verify `job.discard()` works correctly
2. **MUST** add error handling for state transition failures
3. **SHOULD** add worker health monitoring
4. **MUST** test under load (10+ concurrent enrollments)

**Acceptance Criteria**:
- [ ] Worker processes 100 jobs without crashing
- [ ] ValidationErrors properly discarded
- [ ] No "not in active state" errors in logs
- [ ] Jobs cleanly transition between states

---

## Priority 2: COMPLETE CORE FEATURES

### FEATURE-001: My Enrollments Page Polish

**Description**: Complete the enrollment management interface

**Current State**: Basic display working, missing details

**Requirements**:
- [ ] Show waitlist position prominently
- [ ] Show "Processing" status for pending enrollments
- [ ] Add color-coded status badges (green=enrolled, yellow=waitlist, grey=pending)
- [ ] Show estimated promotion time for waitlist
- [ ] Add "Cancel enrollment" for pending enrollments
- [ ] Refresh data after drop action

**Acceptance Criteria**:
- User can see all enrollment states clearly
- Waitlist position updates in real-time
- Drop action immediate feedback

---

### FEATURE-002: Course Search Enhancement

**Description**: Improve course discovery

**Current State**: Basic search works

**Requirements**:
- [ ] Add search by instructor name
- [ ] Add filters: available only, my department, has prerequisites
- [ ] Show availability (X/Y seats) in search results
- [ ] Add "Add to cart" for multiple enrollments
- [ ] Sort by: name, code, department, availability

**Acceptance Criteria**:
- User can find courses easily
- Filters work correctly
- Results load within 500ms

---

### FEATURE-003: Enrollment History

**Description**: Track all enrollment actions

**Current State**: AuditLog exists but no UI

**Requirements**:
- [ ] Show history of all enrollments (enrolled, dropped, rejected)
- [ ] Filter by semester/year
- [ ] Show why enrollment was rejected
- [ ] Export history as CSV
- [ ] Show grade for completed courses

---

## Priority 3: NEW FEATURES

### FEATURE-004: Notification System

**Description**: Notify users of important events

**Requirements**:
- [ ] Email notification when promoted from waitlist
- [ ] In-app notification badge
- [ ] Notification preferences page
- [ ] Push notifications (optional)

---

### FEATURE-005: Admin Dashboard

**Description**: Web UI for admin operations

**Requirements**:
- [ ] Course management (create, edit, delete)
- [ ] User management
- [ ] System statistics dashboard
- [ ] Enrollment reports
- [ ] Capacity management

---

### FEATURE-006: Instructor Dashboard

**Description**: Web UI for instructor operations

**Requirements**:
- [ ] View course rosters
- [ ] Assign grades
- [ ] Download student list
- [ ] Course statistics
- [ ] Update course information

---

## Non-Functional Requirements

### Performance
- [ ] API response time < 200ms (95th percentile)
- [ ] Enrollment processing time < 3 seconds
- [ ] Support 1000+ concurrent users
- [ ] Queue throughput: 100+ enrollments/minute

### Security
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma handles this)
- [ ] XSS prevention (React handles this)
- [ ] Rate limiting enforced
- [ ] HTTPS in production
- [ ] Secure password requirements

### Reliability
- [ ] 99.9% uptime
- [ ] Graceful degradation
- [ ] Auto-restart on crashes
- [ ] Data backup every 6 hours
- [ ] Transaction rollback on failures

### Observability
- [ ] Structured logging
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (APM)
- [ ] Queue dashboard
- [ ] Health check endpoints

---

## Testing Strategy

### Unit Tests
- [ ] Business logic (services)
- [ ] Validation functions
- [ ] Time conflict detection
- [ ] Prerequisite checking

### Integration Tests
- [ ] API endpoints
- [ ] Database transactions
- [ ] Queue processing
- [ ] Authentication flow

### E2E Tests
- [ ] Complete enrollment flow
- [ ] Drop course flow
- [ ] Waitlist promotion
- [ ] Search and filter

### Load Tests
- [ ] 1000 concurrent enrollments
- [ ] 10,000 concurrent page views
- [ ] Queue under load
- [ ] Database connection pool

---

## Deployment Checklist

### Pre-Production
- [ ] All critical bugs fixed
- [ ] All Priority 1 features complete
- [ ] Test coverage > 80%
- [ ] Load tests passed
- [ ] Security audit completed
- [ ] Documentation complete

### Production Setup
- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] Redis persistence enabled
- [ ] SSL certificates installed
- [ ] CDN configured
- [ ] Monitoring tools setup
- [ ] Error tracking setup
- [ ] Log aggregation setup

### Launch
- [ ] Soft launch with 100 users
- [ ] Monitor for errors
- [ ] Collect user feedback
- [ ] Fix any issues
- [ ] Full launch

---

## Success Metrics

### Key Performance Indicators (KPIs)

1. **System Reliability**
   - Target: 99.9% uptime
   - Measure: Uptime monitoring tool

2. **User Satisfaction**
   - Target: < 3% error rate in enrollment
   - Target: > 90% successful enrollments
   - Measure: Analytics, user surveys

3. **Performance**
   - Target: Average enrollment time < 2 seconds
   - Target: Page load time < 1 second
   - Measure: APM tools

4. **Business Metrics**
   - Target: 100% of students can enroll
   - Target: < 5% drop rate
   - Target: Average time to enroll: < 5 minutes
   - Measure: Database analytics

---

## Timeline (FILL IN YOUR DATES)

### Week 1: Critical Bug Fixes
- [ ] BUG-001: Fix enrollment blocking issue
- [ ] BUG-002: Fix validation error retries
- [ ] BUG-003: Fix frontend polling
- [ ] BUG-004: Fix worker state management

### Week 2: Core Features
- [ ] FEATURE-001: Polish My Enrollments
- [ ] FEATURE-002: Enhance course search
- [ ] Add comprehensive logging
- [ ] Write unit tests

### Week 3: Testing & Polish
- [ ] Integration tests
- [ ] E2E tests
- [ ] Load testing
- [ ] Bug fixing
- [ ] Documentation

### Week 4: Deployment Prep
- [ ] Production environment setup
- [ ] Security audit
- [ ] Performance optimization
- [ ] Soft launch preparation

---

## Out of Scope (For Now)

These features are **not** included in this version:

- ❌ Mobile app
- ❌ SMS notifications
- ❌ Payment integration
- ❌ Course recommendations AI
- ❌ Social features (groups, chat)
- ❌ Calendar integration
- ❌ Multi-language support
- ❌ Dark mode
- ❌ Accessibility features (WCAG compliance)
- ❌ Advanced analytics dashboard
- ❌ Third-party LMS integration

---

## Open Questions

Add your questions here as you work through implementation:

1. Q: Should we allow enrollment in multiple sections of same course?
   A: [TO BE DECIDED]

2. Q: How long should waitlist positions be held?
   A: [TO BE DECIDED]

3. Q: Should instructors be able to manually add students?
   A: [TO BE DECIDED]

---

## Approval

- [ ] Product Owner: _________________ Date: _______
- [ ] Technical Lead: _________________ Date: _______
- [ ] Stakeholder: ___________________ Date: _______

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-11 | AI Assistant | Initial draft |
| | | | |
