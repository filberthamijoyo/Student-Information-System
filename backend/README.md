# CUHK Course Selection System - Backend

A robust course selection and enrollment management system built with Node.js, Express, TypeScript, and PostgreSQL. This backend API provides comprehensive functionality for students to browse and enroll in courses, instructors to manage their classes, and administrators to oversee the entire system.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control (Student, Instructor, Administrator)
- **Course Management**: Create, update, and browse courses with detailed information and time slots
- **Enrollment System**: Handle course enrollments with conflict detection, waitlist management, and queue processing
- **Real-time Conflict Detection**: Automatically detect time conflicts, prerequisite violations, and credit limit violations
- **Background Job Processing**: Asynchronous enrollment processing using Bull queue
- **Caching**: Redis-based caching for improved performance
- **Rate Limiting**: Protect API endpoints from abuse
- **Database Views**: Optimized database views for common queries
- **Comprehensive Validation**: Request validation using Joi schemas

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Cache**: Redis
- **Queue**: Bull (Redis-based)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: Joi
- **CORS**: cors middleware
- **Rate Limiting**: express-rate-limit

## Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.ts      # PostgreSQL connection pool
│   │   ├── redis.ts         # Redis client setup
│   │   └── queue.ts         # Bull queue configuration
│   ├── types/               # TypeScript type definitions
│   │   ├── user.types.ts
│   │   ├── course.types.ts
│   │   ├── enrollment.types.ts
│   │   ├── api.types.ts
│   │   └── express.types.ts
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts          # Authentication & authorization
│   │   ├── errorHandler.ts  # Global error handling
│   │   └── rateLimiter.ts   # Rate limiting
│   ├── controllers/         # Route controllers
│   │   ├── authController.ts
│   │   ├── courseController.ts
│   │   ├── enrollmentController.ts
│   │   ├── adminController.ts
│   │   └── instructorController.ts
│   ├── routes/              # API routes
│   │   ├── authRoutes.ts
│   │   ├── courseRoutes.ts
│   │   ├── enrollmentRoutes.ts
│   │   ├── adminRoutes.ts
│   │   └── instructorRoutes.ts
│   ├── utils/               # Utility functions
│   │   ├── validation.ts    # Request validation schemas
│   │   ├── conflictDetection.ts  # Enrollment conflict detection
│   │   └── helpers.ts       # Helper functions
│   ├── workers/             # Background workers
│   │   └── enrollmentWorker.ts
│   └── server.ts            # Express server setup
├── database/
│   ├── schema.sql           # Database schema
│   ├── seed.sql             # Sample data
│   └── migrate.ts           # Migration script
├── tsconfig.json
├── package.json
├── .env.example
└── README.md
```

## Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 13.0
- Redis >= 6.0
- npm >= 9.0.0

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure your environment variables:
   ```env
   PORT=5000
   NODE_ENV=development

   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/course_selection
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=course_selection
   DB_USER=postgres
   DB_PASSWORD=your_password

   # JWT
   JWT_SECRET=your-super-secret-key
   JWT_EXPIRY=24h

   # Redis
   REDIS_URL=redis://localhost:6379
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

4. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb course_selection

   # Run migrations (creates tables)
   npm run migrate

   # Run migrations with seed data (optional)
   npm run migrate -- --seed
   ```

5. **Start Redis server**
   ```bash
   redis-server
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```
Starts the server with hot-reload using ts-node-dev.

### Production Mode
```bash
# Build TypeScript to JavaScript
npm run build

# Start the server
npm start
```

### Start Background Worker
```bash
npm run worker
```
Starts the enrollment queue worker for processing enrollments.

## Database Management

### Run Migrations
```bash
# Schema only
npm run migrate

# Schema + seed data
npm run migrate -- --seed

# Rollback (drops all tables)
npm run migrate -- --rollback

# Help
npm run migrate -- --help
```

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/register` | Register a new user | Public |
| POST | `/login` | Login and get JWT token | Public |
| GET | `/me` | Get current user profile | Private |
| POST | `/logout` | Logout user | Private |
| POST | `/change-password` | Change password | Private |

### Courses (`/api/courses`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Get all courses (with filters & pagination) | Public |
| GET | `/search?q=keyword` | Search courses | Public |
| GET | `/departments` | Get all departments | Public |
| GET | `/department/:department` | Get courses by department | Public |
| GET | `/:id` | Get course by ID | Public |

### Enrollments (`/api/enrollments`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/` | Enroll in a course | Student |
| DELETE | `/:courseId` | Drop a course | Student |
| GET | `/my-courses` | Get current enrollments | Student |
| GET | `/history` | Get enrollment history | Student |
| POST | `/check-eligibility` | Check enrollment eligibility | Student |

### Admin (`/api/admin`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/courses` | Create a new course | Admin |
| PUT | `/courses/:id` | Update course | Admin |
| DELETE | `/courses/:id` | Delete course | Admin |
| GET | `/courses/:id/enrollments` | Get course enrollments | Admin |
| GET | `/users` | Get all users | Admin |
| GET | `/statistics` | Get system statistics | Admin |

### Instructor (`/api/instructor`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/courses` | Get instructor's courses | Instructor |
| GET | `/courses/:courseId/students` | Get enrolled students | Instructor |
| GET | `/courses/:courseId/statistics` | Get course statistics | Instructor |
| PATCH | `/courses/:id` | Update course info | Instructor |
| POST | `/grades` | Assign grade to student | Instructor |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment (development/production) | development |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `DB_NAME` | Database name | course_selection |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRY` | JWT token expiration | 24h |
| `REDIS_URL` | Redis connection URL | redis://localhost:6379 |
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:3000 |
| `MAX_CREDITS_PER_SEMESTER` | Maximum credits per semester | 18 |

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@cuhk.edu.hk",
    "password": "Password123",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student",
    "student_id": "1155123456",
    "major": "Computer Science",
    "year": 2
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@cuhk.edu.hk",
    "password": "Password123"
  }'
```

## User Roles

- **Student**: Can browse courses, enroll, drop courses, view their enrollments
- **Instructor**: Can view their courses, enrolled students, assign grades
- **Administrator**: Full access to create/update/delete courses, view all users and statistics

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error message",
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/enrollments"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **Enrollment**: 30 requests per 5 minutes
- **Search**: 50 requests per minute

## Development

### Code Structure

- All business logic is in controllers
- Validation is handled by Joi schemas in utils/validation.ts
- Conflict detection is separated in utils/conflictDetection.ts
- Database queries use parameterized queries to prevent SQL injection
- All passwords are hashed using bcrypt
- Type safety is enforced throughout with TypeScript

### Adding a New Endpoint

1. Create types in `src/types/`
2. Add validation schema in `src/utils/validation.ts`
3. Create controller function in `src/controllers/`
4. Add route in `src/routes/`
5. Import and use the route in `src/server.ts`

## Testing

```bash
# Run the development server
npm run dev

# Test health endpoint
curl http://localhost:5000/health

# Test API info
curl http://localhost:5000/
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running: `pg_isready`
- Check database credentials in `.env`
- Verify database exists: `psql -l`

### Redis Connection Issues
- Ensure Redis is running: `redis-cli ping`
- Check Redis configuration in `.env`

### Port Already in Use
- Change `PORT` in `.env`
- Or kill the process using the port: `lsof -ti:5000 | xargs kill`

## License

MIT

## Contributors

Your Name - Database Class Project

## Support

For issues or questions, please open an issue in the GitHub repository.
