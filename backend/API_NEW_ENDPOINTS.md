# New API Endpoints Documentation

This document describes the newly added API endpoints for Academic Calendar, Add/Drop Management, Major Change Requests, and Course Evaluations.

## Table of Contents

1. [Academic Calendar API](#academic-calendar-api)
2. [Add/Drop API](#adddrop-api)
3. [Major Change API](#major-change-api)
4. [Course Evaluation API](#course-evaluation-api)

---

## Academic Calendar API

Base URL: `/api/academic-calendar`

### Get Academic Events

**Endpoint:** `GET /api/academic-calendar/events`

**Query Parameters:**
- `term` (optional): Filter by term (e.g., "FALL", "SPRING")
- `year` (optional): Filter by year (e.g., 2024)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "event_type": "ADD_DROP",
      "term": "FALL",
      "year": 2024,
      "start_date": "2024-08-20",
      "end_date": "2024-09-10",
      "name": "Add/Drop Period - Fall 2024",
      "description": "Period to add or drop courses",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/academic-calendar/events?term=FALL&year=2024"
```

---

### Check Add/Drop Status

**Endpoint:** `GET /api/academic-calendar/add-drop-status`

**Description:** Checks if the add/drop period is currently open

**Response:**
```json
{
  "success": true,
  "data": {
    "isOpen": true,
    "period": {
      "id": 1,
      "event_type": "ADD_DROP",
      "term": "FALL",
      "year": 2024,
      "start_date": "2024-08-20",
      "end_date": "2024-09-10",
      "name": "Add/Drop Period - Fall 2024"
    }
  }
}
```

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/academic-calendar/add-drop-status"
```

---

### Get Upcoming Events

**Endpoint:** `GET /api/academic-calendar/upcoming-events`

**Query Parameters:**
- `limit` (optional): Number of events to return (default: 5)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "event_type": "FINAL_EXAM",
      "term": "FALL",
      "year": 2024,
      "start_date": "2024-12-10",
      "end_date": "2024-12-20",
      "name": "Final Exams - Fall 2024"
    }
  ]
}
```

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/academic-calendar/upcoming-events?limit=10"
```

---

### Get Holidays

**Endpoint:** `GET /api/academic-calendar/holidays`

**Query Parameters:**
- `term` (optional): Filter by term
- `year` (optional): Filter by year

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "event_type": "HOLIDAY",
      "term": "FALL",
      "year": 2024,
      "start_date": "2024-11-28",
      "end_date": "2024-11-29",
      "name": "Thanksgiving Break"
    }
  ]
}
```

---

## Add/Drop API

Base URL: `/api/add-drop`

### Create Add/Drop Request

**Endpoint:** `POST /api/add-drop/request`

**Request Body:**
```json
{
  "student_id": 1,
  "course_id": 5,
  "request_type": "ADD",
  "reason": "Need this course for my major requirements",
  "is_late_request": false
}
```

**Validation:**
- `request_type` must be either "ADD" or "DROP"
- For ADD: Checks enrollment status, course capacity, and unit limits (9-18)
- For DROP: Checks if student is enrolled, validates minimum unit requirement

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "student_id": 1,
    "course_id": 5,
    "request_type": "ADD",
    "request_date": "2024-08-25T10:30:00Z",
    "status": "PENDING",
    "reason": "Need this course for my major requirements",
    "is_late_request": false
  },
  "message": "Add/drop request created successfully"
}
```

**Example:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1,
    "course_id": 5,
    "request_type": "ADD",
    "reason": "Need this course for my major requirements",
    "is_late_request": false
  }' \
  "http://localhost:5000/api/add-drop/request"
```

---

### Get My Requests

**Endpoint:** `GET /api/add-drop/my-requests/:studentId`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "student_id": 1,
      "course_id": 5,
      "request_type": "ADD",
      "request_date": "2024-08-25T10:30:00Z",
      "status": "APPROVED",
      "course_code": "CS101",
      "course_name": "Introduction to Computer Science",
      "department": "Computer Science",
      "credits": 3,
      "semester": "FALL",
      "year": 2024,
      "approver_name": "Dr. Smith"
    }
  ]
}
```

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/add-drop/my-requests/1"
```

---

### Get Pending Requests (Admin/Instructor)

**Endpoint:** `GET /api/add-drop/pending-requests`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "student_id": 2,
      "student_name": "John Doe",
      "student_id": "120090002",
      "major": "Computer Science",
      "year_level": 2,
      "course_id": 6,
      "course_code": "MATH201",
      "course_name": "Calculus II",
      "request_type": "DROP",
      "reason": "Schedule conflict",
      "request_date": "2024-08-26T14:20:00Z",
      "status": "PENDING"
    }
  ]
}
```

---

### Approve Request

**Endpoint:** `PUT /api/add-drop/approve/:requestId`

**Request Body:**
```json
{
  "approved_by": 3
}
```

**Actions:**
- For ADD requests: Creates enrollment record and updates course enrollment count
- For DROP requests: Updates enrollment status to DROPPED and decrements course count

**Response:**
```json
{
  "success": true,
  "message": "Request approved successfully"
}
```

**Example:**
```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"approved_by": 3}' \
  "http://localhost:5000/api/add-drop/approve/1"
```

---

### Reject Request

**Endpoint:** `PUT /api/add-drop/reject/:requestId`

**Request Body:**
```json
{
  "approved_by": 3,
  "rejection_reason": "Course is full and no exceptions can be made"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "status": "REJECTED",
    "rejection_reason": "Course is full and no exceptions can be made"
  },
  "message": "Request rejected successfully"
}
```

---

## Major Change API

Base URL: `/api/major-change`

### Create Major Change Request

**Endpoint:** `POST /api/major-change/request`

**Request Body:**
```json
{
  "student_id": 1,
  "requested_major": "Data Science",
  "requested_school": "School of Science and Engineering",
  "gpa": 3.5,
  "units_completed": 30,
  "supporting_documents": "Dean's recommendation letter attached"
}
```

**Validation:**
- Student cannot request the same major they currently have
- Checks for existing pending requests
- Fetches current major/school from user record

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "student_id": 1,
    "current_major": "Computer Science",
    "requested_major": "Data Science",
    "current_school": "School of Science and Engineering",
    "requested_school": "School of Science and Engineering",
    "gpa": 3.5,
    "units_completed": 30,
    "request_date": "2024-08-27T09:15:00Z",
    "status": "PENDING",
    "supporting_documents": "Dean's recommendation letter attached"
  },
  "message": "Major change request created successfully"
}
```

**Example:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1,
    "requested_major": "Data Science",
    "requested_school": "School of Science and Engineering",
    "gpa": 3.5,
    "units_completed": 30
  }' \
  "http://localhost:5000/api/major-change/request"
```

---

### Get My Major Change Requests

**Endpoint:** `GET /api/major-change/my-requests/:studentId`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "student_id": 1,
      "current_major": "Computer Science",
      "requested_major": "Data Science",
      "request_date": "2024-08-27T09:15:00Z",
      "status": "APPROVED",
      "approval_decision": "Approved based on excellent academic standing",
      "decision_date": "2024-08-30T10:00:00Z"
    }
  ]
}
```

---

### Get Pending Requests (Admin)

**Endpoint:** `GET /api/major-change/pending-requests`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "student_id": 2,
      "student_name": "Jane Smith",
      "student_id": "120090003",
      "student_email": "jane.smith@link.cuhk.edu.cn",
      "year_level": 3,
      "current_major": "Mathematics",
      "requested_major": "Statistics",
      "gpa": 3.8,
      "units_completed": 60,
      "request_date": "2024-08-28T11:30:00Z",
      "status": "PENDING"
    }
  ]
}
```

---

### Approve or Reject Request

**Endpoint:** `PUT /api/major-change/decide/:requestId`

**Request Body:**
```json
{
  "status": "APPROVED",
  "approval_decision": "Approved based on excellent academic standing and clear justification",
  "approver_id": 3
}
```

**Actions:**
- If APPROVED: Updates student's major and department in users table
- Sets decision_date to current timestamp

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "APPROVED",
    "approval_decision": "Approved based on excellent academic standing",
    "decision_date": "2024-08-30T10:00:00Z"
  },
  "message": "Request approved successfully"
}
```

**Example:**
```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "approval_decision": "Approved based on excellent academic standing",
    "approver_id": 3
  }' \
  "http://localhost:5000/api/major-change/decide/1"
```

---

## Course Evaluation API

Base URL: `/api/course-evaluation`

### Submit Evaluation

**Endpoint:** `POST /api/course-evaluation/submit`

**Request Body:**
```json
{
  "student_id": 1,
  "course_id": 5,
  "term": "FALL",
  "year": 2024,
  "overall_rating": 5,
  "instructor_rating": 5,
  "course_content_rating": 4,
  "workload_rating": 3,
  "comments": "Excellent course! Very challenging but rewarding.",
  "is_anonymous": true
}
```

**Validation:**
- All ratings must be between 1 and 5
- Student must be enrolled in the course
- UPSERT behavior: Updates if evaluation already exists

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "student_id": 1,
    "course_id": 5,
    "term": "FALL",
    "year": 2024,
    "overall_rating": 5,
    "instructor_rating": 5,
    "course_content_rating": 4,
    "workload_rating": 3,
    "comments": "Excellent course! Very challenging but rewarding.",
    "is_anonymous": true,
    "submitted_at": "2024-12-15T14:30:00Z"
  },
  "message": "Course evaluation submitted successfully"
}
```

**Example:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1,
    "course_id": 5,
    "term": "FALL",
    "year": 2024,
    "overall_rating": 5,
    "instructor_rating": 5,
    "course_content_rating": 4,
    "workload_rating": 3,
    "comments": "Excellent course!",
    "is_anonymous": true
  }' \
  "http://localhost:5000/api/course-evaluation/submit"
```

---

### Get My Evaluations

**Endpoint:** `GET /api/course-evaluation/my-evaluations/:studentId`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "student_id": 1,
      "course_id": 5,
      "term": "FALL",
      "year": 2024,
      "overall_rating": 5,
      "instructor_rating": 5,
      "course_content_rating": 4,
      "workload_rating": 3,
      "comments": "Excellent course!",
      "is_anonymous": true,
      "submitted_at": "2024-12-15T14:30:00Z",
      "course_code": "CS101",
      "course_name": "Introduction to Computer Science",
      "department": "Computer Science"
    }
  ]
}
```

---

### Get Course Statistics

**Endpoint:** `GET /api/course-evaluation/course-stats/:courseId`

**Description:** Returns aggregated statistics and comments (respecting anonymity)

**Response:**
```json
{
  "success": true,
  "data": {
    "course": {
      "course_code": "CS101",
      "course_name": "Introduction to Computer Science",
      "department": "Computer Science"
    },
    "statistics": {
      "total_responses": 25,
      "average_overall_rating": "4.52",
      "average_instructor_rating": "4.68",
      "average_course_content_rating": "4.32",
      "average_workload_rating": "3.84"
    },
    "comments": [
      {
        "comments": "Great introduction to CS concepts",
        "submitted_at": "2024-12-15T14:30:00Z",
        "student_name": "Anonymous"
      },
      {
        "comments": "Professor explains difficult concepts clearly",
        "submitted_at": "2024-12-14T10:15:00Z",
        "student_name": "John Doe"
      }
    ]
  }
}
```

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/course-evaluation/course-stats/5"
```

---

### Get Pending Evaluations

**Endpoint:** `GET /api/course-evaluation/pending/:studentId`

**Description:** Returns courses the student is enrolled in but hasn't evaluated yet

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 6,
      "course_code": "MATH201",
      "course_name": "Calculus II",
      "department": "Mathematics",
      "semester": "FALL",
      "year": 2024,
      "credits": 4,
      "instructor_name": "Dr. Johnson"
    }
  ]
}
```

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/course-evaluation/pending/1"
```

---

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200` - Success (GET requests)
- `201` - Created successfully (POST requests)
- `400` - Bad request (validation errors)
- `403` - Forbidden (authorization errors)
- `404` - Not found
- `500` - Server error

---

## Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Testing Checklist

- [ ] GET /api/academic-calendar/events
- [ ] GET /api/academic-calendar/add-drop-status
- [ ] POST /api/add-drop/request (ADD)
- [ ] POST /api/add-drop/request (DROP)
- [ ] GET /api/add-drop/my-requests/:studentId
- [ ] PUT /api/add-drop/approve/:requestId
- [ ] PUT /api/add-drop/reject/:requestId
- [ ] POST /api/major-change/request
- [ ] GET /api/major-change/pending-requests
- [ ] PUT /api/major-change/decide/:requestId
- [ ] POST /api/course-evaluation/submit
- [ ] GET /api/course-evaluation/course-stats/:courseId
- [ ] GET /api/course-evaluation/pending/:studentId

---

## Database Requirements

Ensure the following tables exist in your database:
- `academic_events`
- `course_add_drop_requests`
- `major_change_requests`
- `course_evaluations`
- `enrollment_rules`
- `courses`
- `enrollments`
- `users`

---

## Notes

1. **Transaction Safety**: Add/drop approval and major change decisions use database transactions to ensure data consistency.

2. **Business Logic**:
   - Add requests check enrollment capacity and unit limits (9-18 units)
   - Drop requests validate minimum unit requirements
   - Major changes prevent duplicate majors

3. **Data Validation**: All endpoints validate required fields and data types before processing.

4. **Security**: SQL injection is prevented through parameterized queries ($1, $2, etc.).

5. **Anonymity**: Course evaluation statistics respect student anonymity settings.
