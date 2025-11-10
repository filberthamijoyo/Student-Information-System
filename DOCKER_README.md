# CUHK Course Selection System - Docker Setup 🐳

Complete guide for running the CUHK Course Selection System using Docker.

## 🚀 Quick Start (Recommended)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Git

### One-Command Setup
```bash
# From project root
docker-compose up
```

That's it! The system will automatically:
1. ✅ Start PostgreSQL database
2. ✅ Create tables from schema.sql
3. ✅ Load sample data from seed.sql
4. ✅ Start Redis cache
5. ✅ Start Backend API server (port 5000)
6. ✅ Start Enrollment worker for queue processing

**Access the API:** http://localhost:5000

## 📋 Default Credentials (Sample Data)

### Student Accounts
- Email: `alice.wang@link.cuhk.edu.hk` / Password: `Password123` (see seed.sql for actual hash)
- Email: `bob.liu@link.cuhk.edu.hk` / Password: `Password123`

### Administrator Account
- Email: `admin@cuhk.edu.hk` / Password: `Password123`

### Instructor Accounts
- Email: `john.smith@cuhk.edu.hk` / Password: `Password123`
- Email: `mary.chen@cuhk.edu.hk` / Password: `Password123`

> **Note:** Passwords in seed.sql are hashed with bcrypt. Update `backend/database/seed.sql` to set actual passwords.

## 🛠️ Common Commands

### Start Everything
```bash
docker-compose up
```

### Start in Background (Detached Mode)
```bash
docker-compose up -d
```

### View Logs
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Worker only
docker-compose logs -f worker

# Database only
docker-compose logs -f postgres

# Redis only
docker-compose logs -f redis
```

### Stop Everything
```bash
docker-compose down
```

### Stop and Remove Volumes (Fresh Start)
```bash
docker-compose down -v
```

### Restart a Service
```bash
docker-compose restart backend
docker-compose restart worker
docker-compose restart postgres
docker-compose restart redis
```

### Rebuild After Code Changes
```bash
# Rebuild and restart
docker-compose up --build

# Rebuild specific service
docker-compose build backend
docker-compose up backend
```

### Reset Database (Fresh Start)
```bash
# This will delete all data and recreate database
docker-compose down -v
docker-compose up
```

## 🗄️ Database Management

### Access PostgreSQL
```bash
docker exec -it cuhk-postgres psql -U postgres -d course_selection
```

### Common SQL Commands
```bash
# Count users
docker exec cuhk-postgres psql -U postgres -d course_selection -c "SELECT COUNT(*) FROM users;"

# View all courses
docker exec cuhk-postgres psql -U postgres -d course_selection -c "SELECT course_code, course_name FROM courses;"

# View enrollments
docker exec cuhk-postgres psql -U postgres -d course_selection -c "SELECT * FROM enrollments;"

# Check time slots
docker exec cuhk-postgres psql -U postgres -d course_selection -c "SELECT * FROM time_slots LIMIT 10;"
```

### Backup Database
```bash
docker exec cuhk-postgres pg_dump -U postgres course_selection > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
docker exec -i cuhk-postgres psql -U postgres course_selection < backup_20240115.sql
```

### Manual Migration
```bash
# If you need to manually run migrations
docker exec -i cuhk-postgres psql -U postgres course_selection < backend/database/schema.sql
docker exec -i cuhk-postgres psql -U postgres course_selection < backend/database/seed.sql
```

## 🔧 Redis Management

### Access Redis CLI
```bash
docker exec -it cuhk-redis redis-cli
```

### Redis Commands
```bash
# Clear all cache
docker exec cuhk-redis redis-cli FLUSHALL

# View all keys
docker exec cuhk-redis redis-cli KEYS '*'

# Check queue length
docker exec cuhk-redis redis-cli LLEN bull:enrollment-queue:wait

# Monitor Redis activity
docker exec cuhk-redis redis-cli MONITOR
```

## 🐛 Debugging

### Enter Backend Container
```bash
docker exec -it cuhk-backend sh

# Inside container:
npm run build
ls -la
cat .env
ps aux
```

### Check Container Status
```bash
docker ps

# View all containers (including stopped)
docker ps -a
```

### View Resource Usage
```bash
docker stats

# View specific container
docker stats cuhk-backend
```

### Check Network
```bash
docker network ls
docker network inspect cuhk-network
```

### Inspect Container
```bash
docker inspect cuhk-backend
docker inspect cuhk-postgres
```

## 🧪 Testing API

### Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.456,
  "services": {
    "database": "connected",
    "redis": "connected",
    "queue": "active"
  }
}
```

### Register New Student
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@link.cuhk.edu.hk",
    "password": "Test123456",
    "first_name": "Test",
    "last_name": "Student",
    "role": "student",
    "student_id": "1155999999",
    "major": "Computer Science",
    "year": 2
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@link.cuhk.edu.hk",
    "password": "Test123456"
  }'
```

### Get Courses (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl http://localhost:5000/api/courses \
  -H "Authorization: Bearer $TOKEN"
```

## 🔥 Hot Reload Development

Code changes are automatically detected in development mode:

1. Edit files in `backend/src/`
2. Save the file
3. ts-node-dev automatically restarts the server
4. No need to rebuild Docker image

> **Note:** If you add new npm packages, you need to rebuild: `docker-compose up --build`

## 📦 Without Docker (Alternative)

If you prefer running locally without Docker:

```bash
cd backend

# Install dependencies
npm install

# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql

# Start Redis (macOS with Homebrew)
brew services start redis

# Create database
createdb course_selection

# Copy and edit .env
cp .env.example .env
# Update to use localhost instead of container names:
# DB_HOST=localhost
# REDIS_HOST=localhost

# Run migrations with seed data
npm run migrate -- --seed

# Terminal 1: Start API
npm run dev

# Terminal 2: Start Worker
npm run worker
```

## 🚨 Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :5000  # Backend
lsof -i :6379  # Redis
lsof -i :5432  # PostgreSQL

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Database Connection Failed

```bash
# Check if postgres container is running
docker ps | grep postgres

# View postgres logs
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres

# Check if database exists
docker exec cuhk-postgres psql -U postgres -l
```

### Redis Connection Failed

```bash
# Check redis
docker ps | grep redis

# Test redis connection
docker exec cuhk-redis redis-cli ping

# Restart redis
docker-compose restart redis
```

### Worker Not Processing Jobs

```bash
# Check worker logs
docker-compose logs -f worker

# Restart worker
docker-compose restart worker

# Check queue length in redis
docker exec cuhk-redis redis-cli LLEN bull:enrollment-queue:wait

# View failed jobs
docker exec cuhk-redis redis-cli LLEN bull:enrollment-queue:failed
```

### Backend Not Starting

```bash
# Check backend logs
docker-compose logs backend

# Common issues:
# 1. Database not ready - wait a bit and restart
# 2. Redis not ready - wait a bit and restart
# 3. Port conflict - change PORT in docker-compose.yml

# Rebuild backend
docker-compose build backend
docker-compose up backend
```

### Permission Denied Issues

```bash
# Fix node_modules permissions
docker-compose down
docker volume rm cuhk-course-selection_backend_node_modules
docker-compose up --build
```

## 🏗️ Production Deployment

### Using Production Dockerfile

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production  # Use production stage
    environment:
      NODE_ENV: production
      # Use environment variables from hosting platform
```

### Important Production Considerations

1. **Change JWT Secret:**
   ```bash
   # Generate secure random secret
   openssl rand -base64 32
   ```

2. **Use Managed Database:**
   - AWS RDS
   - Google Cloud SQL
   - Supabase
   - DigitalOcean Managed Database

3. **Use Managed Redis:**
   - AWS ElastiCache
   - Google Cloud Memorystore
   - Upstash
   - Redis Cloud

4. **Environment Variables:**
   - Never commit `.env` files
   - Use platform secrets management
   - Set `NODE_ENV=production`

5. **SSL/TLS:**
   - Enable SSL for database connections
   - Use HTTPS for API
   - Configure proper CORS settings

## 📊 Monitoring

### Container Stats

```bash
# Real-time stats
docker stats

# Resource usage
docker system df
```

### Logs Management

```bash
# Limit log size in docker-compose.yml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 🔑 Environment Variables

All environment variables are set in `docker-compose.yml`. Key variables:

| Variable | Description | Default (Docker) |
|----------|-------------|------------------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `5000` |
| `DB_HOST` | Database host | `postgres` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `course_selection` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `postgres123` |
| `REDIS_HOST` | Redis host | `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_SECRET` | JWT secret key | (change in production!) |

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

## 🆘 Getting Help

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify all containers are running: `docker ps`
3. Check health endpoint: `curl http://localhost:5000/health`
4. Restart services: `docker-compose restart`
5. Fresh start: `docker-compose down -v && docker-compose up`

## 📝 License

MIT License - See LICENSE file for details
