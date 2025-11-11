# Supabase Migration Guide

This guide will help you migrate from local PostgreSQL to Supabase.

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in the details:
   - **Project Name**: `cuhk-course-selection`
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to you (e.g., `Southeast Asia (Singapore)`)
   - **Pricing Plan**: Free tier is sufficient for development

4. Wait 2-3 minutes for project setup to complete

## Step 2: Get Database Connection Strings

1. In your Supabase project dashboard, go to **Settings** → **Database**

2. You'll find two connection strings:

   **Connection Pooling (Transaction Mode)** - Use this one for Prisma:
   ```
   postgres://postgres.xxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```

   **Direct Connection** - For migrations only:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```

3. Copy both URLs (you'll need them in the next step)

## Step 3: Update Backend Environment Variables

1. Open `/backend/.env` file

2. Replace the PostgreSQL URLs with your Supabase URLs:

```bash
# Supabase Database Configuration (Transaction Mode for Prisma)
DATABASE_URL="postgres://postgres.xxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct connection for migrations (no connection pooling)
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres"
```

**Important Notes:**
- Add `?pgbouncer=true&connection_limit=1` to the pooled connection
- Replace `[YOUR-PASSWORD]` with your actual database password
- The pooled URL uses port `6543`, direct uses `5432`
- Keep the Redis configuration as-is (still runs locally)

## Step 4: Update Prisma Schema

The Prisma schema has already been updated to support both connection strings. It now includes:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Pooled connection for queries
  directUrl = env("DIRECT_URL")        // Direct connection for migrations
}
```

## Step 5: Run Database Migrations

1. Make sure you're in the backend directory:
```bash
cd backend
```

2. Push the schema to Supabase:
```bash
npx prisma db push
```

3. Seed the database with 49 real CUHK courses:
```bash
npx prisma db seed
```

4. Verify the migration:
```bash
npx prisma studio
```
This opens a GUI where you can see all your tables and data.

## Step 6: Verify Connection

1. Start the backend server:
```bash
npm run dev
```

2. You should see:
```
✓ Connected to Supabase database
Server running on port 5000
Redis connected
Worker started
```

3. Test the API:
```bash
curl http://localhost:5000/api/courses
```

## Step 7: Update Docker Compose (Optional)

Since PostgreSQL is now hosted on Supabase, you only need Redis locally:

```bash
cd ..  # Back to project root
docker-compose up -d redis
```

## Troubleshooting

### Connection Timeout
- **Issue**: `Error: P1001: Can't reach database server`
- **Solution**: Check your IP is allowed in Supabase dashboard → Settings → Database → Connection Pooling → Add your IP to allowlist

### Migration Errors
- **Issue**: `Error: P3009: migrate found failed migrations`
- **Solution**: Use `npx prisma db push` instead of `npx prisma migrate dev` for Supabase

### SSL Certificate Errors
- **Issue**: `Error: self signed certificate in certificate chain`
- **Solution**: Add `?sslmode=require` to your connection string

### Connection Pool Exhausted
- **Issue**: `Error: Can't reach database server. Please make sure your database server is running`
- **Solution**: This happens with Supabase's connection pooler. Make sure you're using `?pgbouncer=true&connection_limit=1` in DATABASE_URL

## Supabase Dashboard Features

### SQL Editor
Run custom queries directly in Supabase:
```sql
-- Check enrollment count
SELECT COUNT(*) FROM "Enrollment";

-- View courses with enrollment stats
SELECT
  "courseCode",
  "courseName",
  "currentEnrollment",
  "maxCapacity"
FROM "Course"
ORDER BY "currentEnrollment" DESC;
```

### Table Editor
View and edit data directly in the browser (similar to Prisma Studio)

### Database Backups
- Automatic daily backups (available in paid plans)
- Manual backups: Settings → Database → Backup

### Performance Monitoring
- Query performance insights
- Connection pool metrics
- Database size tracking

## Production Deployment Benefits

✅ **Automatic Backups**: Daily backups with point-in-time recovery
✅ **Connection Pooling**: Built-in PgBouncer for efficient connections
✅ **SSL Encryption**: All connections encrypted by default
✅ **Real-time Subscriptions**: Can add real-time enrollment updates
✅ **Global CDN**: Fast access from anywhere
✅ **Free Tier**: 500MB database, 2GB bandwidth/month

## Cost Comparison

| Plan | Database Size | Bandwidth | Price |
|------|---------------|-----------|-------|
| Free | 500 MB | 2 GB/month | $0 |
| Pro | 8 GB | 50 GB/month | $25/month |
| Team | 50 GB | 250 GB/month | $599/month |

For this course project, the **Free tier is sufficient**.

## Next Steps

Once everything is working:
1. ✅ Test course enrollment with Supabase
2. ✅ Test concurrent enrollments (stress test)
3. ✅ Deploy frontend to Vercel/Netlify
4. ✅ Deploy backend to Railway/Render
5. ✅ Update README with production URLs

## Rollback (If Needed)

To revert to local PostgreSQL:
1. Restore the original `DATABASE_URL` in `.env`
2. Run `docker-compose up -d postgres redis`
3. Run `npx prisma db push` and `npx prisma db seed`

---

**Questions?** Check Supabase docs: https://supabase.com/docs/guides/database
