# Complete SIS API Testing Guide

## Overview

This document provides comprehensive testing examples for all Student Information System (SIS) APIs.

**Base URL:** `http://localhost:5000/api`

## Authentication

All endpoints (except `/api/auth/login` and `/api/auth/register`) require authentication.

### Get Access Token

```bash
# Login as Student
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "120090001",
    "password": "Password123!"
  }'

# Login as Instructor
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "inst001",
    "password": "Password123!"
  }'

# Login as Admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin001",
    "password": "Password123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "alice.wang@link.cuhk.edu.cn",
      "fullName": "Alice Wang",
      "role": "STUDENT"
    }
  }
}
```

**Use the token in subsequent requests:**
```bash
export TOKEN="your_access_token_here"
```

---

## 1. Academic Records API (`/api/academic`)

### 1.1 Get All Grades

```bash
curl -X GET http://localhost:5000/api/academic/grades \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "enrollmentId": 1,
      "semester": "SPRING",
      "year": 2024,
      "courseCode": "CSC3100",
      "courseName": "Data Structures",
      "credits": 3,
      "letterGrade": "A",
      "numericGrade": 92,
      "gradePoints": 4.0,
      "status": "PUBLISHED"
    }
  ]
}
```

### 1.2 Get Grades by Term

```bash
curl -X GET "http://localhost:5000/api/academic/grades/term?semester=FALL&year=2024" \
  -H "Authorization: Bearer $TOKEN"
```

### 1.3 Get Complete Transcript

```bash
curl -X GET http://localhost:5000/api/academic/transcript \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "transcripts": [
      {
        "semester": "SPRING",
        "year": 2024,
        "termGPA": 3.85,
        "cumulativeGPA": 3.85,
        "totalCredits": 60,
        "earnedCredits": 60,
        "academicStanding": "Good Standing"
      }
    ],
    "enrollmentsByTerm": {
      "2024-SPRING": [
        {
          "courseCode": "CSC3100",
          "courseName": "Data Structures",
          "credits": 3,
          "grade": "A",
          "gradePoints": 4.0
        }
      ]
    },
    "summary": {
      "cumulativeGPA": 3.85,
      "totalCredits": 60,
      "earnedCredits": 60,
      "academicStanding": "Good Standing"
    }
  }
}
```

### 1.4 Get GPA Information

```bash
curl -X GET http://localhost:5000/api/academic/gpa \
  -H "Authorization: Bearer $TOKEN"
```

### 1.5 Get GPA History

```bash
curl -X GET http://localhost:5000/api/academic/gpa/history \
  -H "Authorization: Bearer $TOKEN"
```

---

## 2. Financial API (`/api/financial`)

### 2.1 Get Account Summary

```bash
curl -X GET http://localhost:5000/api/financial/account \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "balance": -30000,
    "tuitionDue": 25000,
    "housingDue": 5000,
    "otherDue": 0,
    "totalDue": 30000,
    "lastUpdated": "2024-11-12T08:00:00.000Z"
  }
}
```

### 2.2 Get All Charges

```bash
curl -X GET http://localhost:5000/api/financial/charges \
  -H "Authorization: Bearer $TOKEN"
```

### 2.3 Get Unpaid Charges

```bash
curl -X GET http://localhost:5000/api/financial/charges/unpaid \
  -H "Authorization: Bearer $TOKEN"
```

### 2.4 Get Payment History

```bash
curl -X GET http://localhost:5000/api/financial/payments \
  -H "Authorization: Bearer $TOKEN"
```

### 2.5 Make a Payment

```bash
curl -X POST http://localhost:5000/api/financial/payments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "method": "BANK_TRANSFER",
    "referenceNumber": "TXN20241112001"
  }'
```

### 2.6 Get Billing Statement

```bash
curl -X GET http://localhost:5000/api/financial/statement/FALL/2024 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 3. Applications API (`/api/applications`)

### 3.1 Get My Applications

```bash
curl -X GET http://localhost:5000/api/applications \
  -H "Authorization: Bearer $TOKEN"
```

### 3.2 Submit New Application

```bash
curl -X POST http://localhost:5000/api/applications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "OVERLOAD_REQUEST",
    "semester": "FALL",
    "year": 2024,
    "reason": "I would like to take an additional course to graduate early."
  }'
```

**Application Types:**
- `LEAVE_OF_ABSENCE`
- `WITHDRAWAL`
- `MAJOR_CHANGE`
- `MINOR_DECLARATION`
- `CREDIT_TRANSFER`
- `OVERLOAD_REQUEST`
- `GRADE_APPEAL`
- `READMISSION`
- `GRADUATION_APPLICATION`

### 3.3 View Application Details

```bash
curl -X GET http://localhost:5000/api/applications/1 \
  -H "Authorization: Bearer $TOKEN"
```

### 3.4 Withdraw Application

```bash
curl -X PUT http://localhost:5000/api/applications/1/withdraw \
  -H "Authorization: Bearer $TOKEN"
```

### 3.5 Get Pending Applications (Admin Only)

```bash
curl -X GET http://localhost:5000/api/applications/admin/pending \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 3.6 Review Application (Admin Only)

```bash
curl -X PUT http://localhost:5000/api/applications/admin/1/review \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "decision": "Approved",
    "reviewNotes": "Request approved. Student has demonstrated strong academic performance."
  }'
```

---

## 4. Personal Information API (`/api/personal`)

### 4.1 Get Personal Information

```bash
curl -X GET http://localhost:5000/api/personal \
  -H "Authorization: Bearer $TOKEN"
```

### 4.2 Update Personal Information

```bash
curl -X PUT http://localhost:5000/api/personal \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+86 138 0000 1234",
    "city": "Shenzhen",
    "state": "Guangdong"
  }'
```

### 4.3 Update Emergency Contact

```bash
curl -X PUT http://localhost:5000/api/personal/emergency-contact \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emergencyName": "John Doe",
    "emergencyRelation": "Father",
    "emergencyPhone": "+86 138 0000 5678",
    "emergencyEmail": "john.doe@example.com"
  }'
```

### 4.4 Update Address

```bash
curl -X PUT http://localhost:5000/api/personal/address \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permanentAddress": "123 Main Street, Apt 4B",
    "city": "Shenzhen",
    "state": "Guangdong",
    "postalCode": "518000",
    "country": "China"
  }'
```

---

## 5. Planning & Advising API (`/api/planning`)

### 5.1 Get Degree Audit

```bash
curl -X GET http://localhost:5000/api/planning/degree-audit \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "major": {
      "code": "CS",
      "name": "Computer Science",
      "degree": "BS",
      "totalCredits": 120
    },
    "progress": {
      "totalCreditsRequired": 120,
      "totalCreditsEarned": 60,
      "percentageComplete": 50
    },
    "requirements": [
      {
        "category": "Core Courses",
        "name": "Programming Fundamentals",
        "requiredCredits": 18,
        "completedCredits": 9,
        "courses": ["CSC1001", "CSC1002", "CSC3100", "CSC3170", "CSC4001", "CSC4005"],
        "completedCourses": ["CSC1001", "CSC3100", "CSC3170"],
        "percentage": 50
      }
    ]
  }
}
```

### 5.2 Get Major Requirements

```bash
curl -X GET http://localhost:5000/api/planning/requirements \
  -H "Authorization: Bearer $TOKEN"
```

### 5.3 Get Overall Progress

```bash
curl -X GET http://localhost:5000/api/planning/progress \
  -H "Authorization: Bearer $TOKEN"
```

### 5.4 Get Advisor Information

```bash
curl -X GET http://localhost:5000/api/planning/advisor \
  -H "Authorization: Bearer $TOKEN"
```

---

## 6. Faculty Center API (`/api/faculty`)

**Note:** These endpoints require INSTRUCTOR role.

### 6.1 Get My Teaching Courses

```bash
curl -X GET http://localhost:5000/api/faculty/courses \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN"
```

### 6.2 Get Course Roster

```bash
curl -X GET http://localhost:5000/api/faculty/courses/1/roster \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN"
```

### 6.3 Get Course Grades

```bash
curl -X GET http://localhost:5000/api/faculty/courses/1/grades \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN"
```

### 6.4 Submit Grades

```bash
curl -X POST http://localhost:5000/api/faculty/grades/submit \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "grades": [
      {
        "enrollmentId": 1,
        "numericGrade": 92,
        "letterGrade": "A",
        "comments": "Excellent work"
      },
      {
        "enrollmentId": 2,
        "numericGrade": 85,
        "letterGrade": "B+",
        "comments": "Good performance"
      }
    ]
  }'
```

### 6.5 Update Single Grade

```bash
curl -X PUT http://localhost:5000/api/faculty/grades/1 \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "numericGrade": 95,
    "letterGrade": "A+",
    "comments": "Outstanding work!"
  }'
```

### 6.6 Get Attendance Records

```bash
curl -X GET http://localhost:5000/api/faculty/courses/1/attendance \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN"
```

### 6.7 Mark Attendance

```bash
curl -X POST http://localhost:5000/api/faculty/attendance \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attendanceRecords": [
      {
        "enrollmentId": 1,
        "date": "2024-11-12",
        "status": "PRESENT"
      },
      {
        "enrollmentId": 2,
        "date": "2024-11-12",
        "status": "ABSENT",
        "notes": "Sick"
      }
    ]
  }'
```

**Attendance Status Options:**
- `PRESENT`
- `ABSENT`
- `LATE`
- `EXCUSED`

### 6.8 Get Course Materials

```bash
curl -X GET http://localhost:5000/api/faculty/courses/1/materials \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN"
```

### 6.9 Upload Course Material

```bash
curl -X POST http://localhost:5000/api/faculty/courses/1/materials \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Week 5 Lecture Slides",
    "description": "Introduction to Algorithms",
    "type": "LECTURE_NOTES",
    "fileUrl": "/uploads/csc3170-week5.pdf",
    "fileName": "csc3170-week5.pdf",
    "fileSize": 2048000,
    "isVisible": true
  }'
```

**Material Types:**
- `SYLLABUS`
- `LECTURE_NOTES`
- `ASSIGNMENT`
- `READING`
- `EXAM`
- `SOLUTION`
- `RECORDING`
- `OTHER`

---

## 7. Campus Information API (`/api/campus`)

### 7.1 Get All Announcements

```bash
curl -X GET http://localhost:5000/api/campus/announcements \
  -H "Authorization: Bearer $TOKEN"
```

### 7.2 Get Specific Announcement

```bash
curl -X GET http://localhost:5000/api/campus/announcements/1 \
  -H "Authorization: Bearer $TOKEN"
```

### 7.3 Get All Events

```bash
curl -X GET http://localhost:5000/api/campus/events \
  -H "Authorization: Bearer $TOKEN"
```

### 7.4 Get Events by Category

```bash
curl -X GET "http://localhost:5000/api/campus/events?category=CAREER" \
  -H "Authorization: Bearer $TOKEN"
```

**Event Categories:**
- `ACADEMIC`
- `CULTURAL`
- `SPORTS`
- `WORKSHOP`
- `SOCIAL`
- `CAREER`
- `OTHER`

### 7.5 Get Upcoming Events

```bash
curl -X GET http://localhost:5000/api/campus/events/upcoming \
  -H "Authorization: Bearer $TOKEN"
```

### 7.6 Register for Event

```bash
curl -X POST http://localhost:5000/api/campus/events/1/register \
  -H "Authorization: Bearer $TOKEN"
```

---

## Testing with Postman

### Import Collection

1. Create a new Collection in Postman
2. Add the following environment variables:
   - `base_url`: `http://localhost:5000/api`
   - `student_token`: (get from login)
   - `instructor_token`: (get from login)
   - `admin_token`: (get from login)

3. Use `{{base_url}}` and `{{student_token}}` in requests

### Example Request in Postman:

**GET My Grades**
- Method: `GET`
- URL: `{{base_url}}/academic/grades`
- Headers:
  - Authorization: `Bearer {{student_token}}`

---

## Demo User Credentials

### Students
| User ID | Email | Password | Student ID |
|---------|-------|----------|------------|
| 120090001 | alice.wang@link.cuhk.edu.cn | Password123! | 120090001 |
| 120090002 | bob.liu@link.cuhk.edu.cn | Password123! | 120090002 |

### Instructors
| User ID | Email | Password |
|---------|-------|----------|
| inst001 | john.smith@cuhk.edu.cn | Password123! |
| inst002 | mary.zhang@cuhk.edu.cn | Password123! |

### Admin
| User ID | Email | Password |
|---------|-------|----------|
| admin001 | admin@link.cuhk.edu.cn | Password123! |

---

## Quick Test Script

Save this as `test-apis.sh`:

```bash
#!/bin/bash

# Login and get token
echo "Logging in as student..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "120090001",
    "password": "Password123!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

echo "Token: $TOKEN"
echo ""

# Test endpoints
echo "Testing GET /api/academic/grades..."
curl -s -X GET http://localhost:5000/api/academic/grades \
  -H "Authorization: Bearer $TOKEN" | jq

echo ""
echo "Testing GET /api/academic/gpa..."
curl -s -X GET http://localhost:5000/api/academic/gpa \
  -H "Authorization: Bearer $TOKEN" | jq

echo ""
echo "Testing GET /api/financial/account..."
curl -s -X GET http://localhost:5000/api/financial/account \
  -H "Authorization: Bearer $TOKEN" | jq

echo ""
echo "Testing GET /api/planning/progress..."
curl -s -X GET http://localhost:5000/api/planning/progress \
  -H "Authorization: Bearer $TOKEN" | jq

echo ""
echo "All tests complete!"
```

Run with: `chmod +x test-apis.sh && ./test-apis.sh`

---

## Expected Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | GET requests successful |
| 201 | Created | POST requests creating new resources |
| 400 | Bad Request | Missing required fields |
| 401 | Unauthorized | Invalid or missing token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Database or server issues |

---

## Troubleshooting

### "No token provided"
- Make sure you include the Authorization header
- Format: `Authorization: Bearer <token>`

### "Invalid token"
- Token may have expired
- Login again to get a new token

### "Access denied"
- Your user role doesn't have permission
- Use the correct account (Student/Instructor/Admin)

### "Failed to fetch"
- Check if the backend server is running
- Verify the URL is correct
- Check CORS settings if calling from browser

---

## Next Steps

Once APIs are tested and working:
1. ✅ Backend is ready
2. → Build frontend React components
3. → Integrate frontend with these APIs
4. → Add error handling and loading states
5. → Deploy to production

Happy testing! 🚀
