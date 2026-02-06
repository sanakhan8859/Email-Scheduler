# 🏗️ System Architecture & Design

## Overview

The ReachInbox Email Scheduler is a production-grade distributed system that handles bulk email scheduling, rate limiting, and reliable delivery using a modern microservices-inspired architecture.

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                             │
│  ┌────────────────────────────────────────────────────────┐  │
│  │          Next.js Frontend (React 18 + TS)              │  │
│  │  - Google OAuth Login                                  │  │
│  │  - Email Composer UI                                   │  │
│  │  - Dashboard (Scheduled/Sent)                          │  │
│  │  - Real-time Stats                                     │  │
│  └────────────────────┬───────────────────────────────────┘  │
└─────────────────────────┼─────────────────────────────────────┘
                          │ HTTP/REST + Sessions
                          │
┌─────────────────────────▼─────────────────────────────────────┐
│                    API LAYER                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │         Express.js API Server (TypeScript)             │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │  │
│  │  │ Auth Routes  │  │ Email Routes │  │ Middleware  │  │  │
│  │  │ - Google OAuth│  │ - Schedule  │  │ - Session   │  │  │
│  │  │ - Session Mgmt│  │ - List Jobs │  │ - Auth      │  │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘  │  │
│  └────────────────────┬───────────────────┬───────────────┘  │
└─────────────────────────┼─────────────────┼─────────────────┘
                          │                 │
                          │                 │
         ┌────────────────┘                 └────────────────┐
         │                                                    │
         ▼                                                    ▼
┌─────────────────────┐                          ┌─────────────────────┐
│  PERSISTENCE LAYER  │                          │   QUEUE LAYER       │
│  ┌───────────────┐  │                          │  ┌───────────────┐  │
│  │     MySQL     │  │                          │  │  Redis + BullMQ│ │
│  │               │  │                          │  │                │ │
│  │ - users       │  │                          │  │ - Job Queue   │ │
│  │ - email_jobs  │  │                          │  │ - Delayed Jobs│ │
│  │ - rate_limits │  │                          │  │ - Rate Limits │ │
│  └───────────────┘  │                          │  └───────────────┘  │
└─────────────────────┘                          └──────────┬──────────┘
                                                            │
                                                            │ Job Processing
                                                            │
                                              ┌─────────────▼──────────────┐
                                              │    WORKER LAYER            │
                                              │  ┌──────────────────────┐  │
                                              │  │   BullMQ Worker      │  │
                                              │  │ - Concurrency: 5     │  │
                                              │  │ - Rate Limiting      │  │
                                              │  │ - Retry Logic        │  │
                                              │  │ - Error Handling     │  │
                                              │  └──────────┬───────────┘  │
                                              └─────────────┼──────────────┘
                                                            │
                                                            ▼
                                              ┌─────────────────────────────┐
                                              │   SMTP LAYER                │
                                              │  ┌───────────────────────┐  │
                                              │  │  Ethereal Email       │  │
                                              │  │  (Nodemailer)         │  │
                                              │  │  - Send Emails        │  │
                                              │  │  - Preview URLs       │  │
                                              │  └───────────────────────┘  │
                                              └─────────────────────────────┘
```

## Component Details

### 1. Frontend Layer (Next.js)

**Technology:** Next.js 14, React 18, TypeScript, Tailwind CSS

**Responsibilities:**
- User authentication via Google OAuth
- Email composition interface with CSV upload
- Dashboard with scheduled/sent email views
- Real-time statistics display
- Client-side state management

**Key Components:**
```
src/
├── app/
│   ├── page.tsx              # Landing page with Google login
│   ├── dashboard/page.tsx    # Main dashboard
│   └── layout.tsx            # Root layout
├── components/
│   ├── Header.tsx            # User profile & logout
│   ├── ComposeEmailModal.tsx # Email scheduling form
│   ├── EmailTable.tsx        # Scheduled/sent email lists
│   └── ui/                   # Reusable components
└── lib/
    └── api.ts                # Axios HTTP client
```

**State Management:**
- React hooks (useState, useEffect)
- Auto-refresh every 10 seconds
- Optimistic UI updates

### 2. API Layer (Express.js)

**Technology:** Express.js, TypeScript, Passport.js

**Responsibilities:**
- RESTful API endpoints
- Google OAuth authentication
- Session management
- Request validation
- Error handling

**Routes:**
```
/auth
  GET  /google              - Initiate OAuth
  GET  /google/callback     - OAuth callback
  GET  /me                  - Get current user
  POST /logout              - Logout

/api/emails
  POST /schedule            - Schedule bulk emails
  GET  /scheduled           - List scheduled emails
  GET  /sent                - List sent emails
  GET  /stats               - Get statistics
```

**Middleware Stack:**
```
Request → CORS → Body Parser → Session → Passport → Auth Middleware → Route Handler
```

### 3. Persistence Layer (MySQL)

**Technology:** MySQL 8.0 with mysql2 driver

**Schema:**

```sql
users
├── id (PK)
├── google_id (UNIQUE)
├── email
├── name
├── avatar
└── timestamps

email_jobs
├── id (PK)
├── job_id (UNIQUE, UUID)
├── user_id (FK → users)
├── recipient_email
├── subject
├── body
├── scheduled_time
├── status (ENUM: scheduled, sent, failed)
├── sent_at
├── error_message
└── timestamps

rate_limit_counters
├── id (PK)
├── user_id (FK → users)
├── hour_window (YYYY-MM-DD-HH)
├── email_count
└── timestamps
```

**Indexes:**
- `idx_job_id` on email_jobs.job_id
- `idx_user_id` on email_jobs.user_id
- `idx_status` on email_jobs.status
- `idx_scheduled_time` on email_jobs.scheduled_time
- `idx_user_hour` on rate_limit_counters(user_id, hour_window)

### 4. Queue Layer (Redis + BullMQ)

**Technology:** Redis 7, BullMQ 5

**Responsibilities:**
- Job queue management
- Delayed job scheduling
- Job persistence
- Rate limiting counters
- Worker coordination

**Queue Configuration:**
```typescript
{
  connection: Redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 1000, age: 86400 },
    removeOnFail: { count: 5000, age: 604800 }
  }
}
```

**Job Structure:**
```typescript
{
  jobId: UUID,
  userId: number,
  recipientEmail: string,
  subject: string,
  body: string,
  scheduledTime: Date
}
```

**Delayed Jobs:**
- Each job has a `delay` calculated as: `scheduledTime - currentTime`
- Redis stores delayed jobs in a sorted set
- BullMQ automatically moves jobs to active when delay expires

### 5. Worker Layer (BullMQ Worker)

**Technology:** BullMQ Worker with TypeScript

**Configuration:**
```typescript
{
  concurrency: 5,           // Process 5 jobs in parallel
  limiter: {
    max: 100,               // Max 100 jobs
    duration: 60000         // Per 60 seconds
  }
}
```

**Processing Flow:**

```
┌─────────────────────────────────────────┐
│ 1. Worker receives job from queue       │
│    - Extract job data                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 2. Check rate limit (Redis)             │
│    Key: rate_limit:{userId}:{hour}      │
│    - INCR counter                       │
│    - Check against MAX_EMAILS_PER_HOUR  │
└──────────────┬──────────────────────────┘
               │
               ├─ Limit exceeded
               │  └─> Reschedule to next hour
               │
               ├─ Limit OK
               │
               ▼
┌─────────────────────────────────────────┐
│ 3. Apply minimum delay throttle         │
│    - Sleep for MIN_DELAY_BETWEEN_EMAILS │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 4. Send email via SMTP                  │
│    - Nodemailer → Ethereal              │
│    - Get message ID & preview URL       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 5. Update database                      │
│    - Set status = 'sent'                │
│    - Set sent_at = NOW()                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 6. Record send for rate limiting        │
│    - Persist counter in MySQL           │
└─────────────────────────────────────────┘
```

**Error Handling:**
- Automatic retry (3 attempts with exponential backoff)
- Failed jobs marked in database
- Error messages logged

## Data Flow: Scheduling Emails

### Step-by-Step Flow

```
1. USER UPLOADS CSV
   Frontend → Parse CSV → Extract emails → Show count

2. USER SUBMITS FORM
   FormData {
     recipientFile: File,
     subject: string,
     body: string,
     startTime: Date,
     delayBetweenEmails: number,
     hourlyLimit: number
   }

3. API RECEIVES REQUEST
   POST /api/emails/schedule
   ├── Authenticate user
   ├── Parse CSV file
   ├── Validate inputs
   └── Begin transaction

4. CREATE DATABASE RECORDS
   For each recipient (i = 0 to N):
     job_id = UUID()
     scheduled_time = startTime + (i * delayBetweenEmails)
     
     INSERT INTO email_jobs (
       job_id, user_id, recipient_email,
       subject, body, scheduled_time, status
     ) VALUES (?, ?, ?, ?, ?, ?, 'scheduled')

5. ENQUEUE JOBS TO BULLMQ
   For each recipient (i = 0 to N):
     delay_ms = scheduled_time - NOW()
     
     await emailQueue.add('send-email', {
       jobId, userId, recipientEmail,
       subject, body, scheduledTime
     }, {
       delay: delay_ms,
       jobId: jobId  // Idempotency key
     })

6. JOBS STORED IN REDIS
   Redis stores:
   ├── Delayed queue (sorted set by scheduled time)
   ├── Job data (hash)
   └── Job metadata

7. WORKER PROCESSES JOBS
   When delay expires:
   ├── BullMQ moves job to active queue
   ├── Worker picks job
   ├── Checks rate limit
   ├── Sends email
   └── Updates database

8. FRONTEND UPDATES
   Auto-refresh every 10s:
   ├── Fetch scheduled emails
   ├── Fetch sent emails
   └── Update statistics
```

## Rate Limiting Strategy

### Redis-Based Counters

**Key Format:** `rate_limit:{userId}:{YYYY-MM-DD-HH}`

**Example:** `rate_limit:123:2024-02-06-14` (User 123, 2PM on Feb 6)

**Algorithm:**
```python
def can_send_email(user_id):
    hour_window = current_hour()  # "2024-02-06-14"
    key = f"rate_limit:{user_id}:{hour_window}"
    
    # Atomic increment
    count = redis.INCR(key)
    
    # Set expiry on first increment (65 minutes)
    if count == 1:
        redis.EXPIRE(key, 3900)
    
    # Check limit
    if count <= MAX_EMAILS_PER_HOUR:
        return True
    else:
        # Reschedule to next hour
        next_hour = hour_window + 1 hour
        reschedule_job(job_id, next_hour)
        return False
```

**Benefits:**
- ✅ Atomic operations (safe for multiple workers)
- ✅ Automatic expiration
- ✅ Per-user tracking
- ✅ Hourly windows
- ✅ Persistent in MySQL for audit

### Persistence Strategy

**Dual Persistence:**
1. **Redis**: Active rate limit counters (expires in 65 mins)
2. **MySQL**: Historical record of all counts

**MySQL Record:**
```sql
INSERT INTO rate_limit_counters (user_id, hour_window, email_count)
VALUES (123, '2024-02-06-14', 1)
ON DUPLICATE KEY UPDATE email_count = email_count + 1
```

**Recovery on Restart:**
- Redis counters may be lost (volatile memory)
- Worker checks MySQL on startup
- Rebuilds Redis counters from MySQL if needed
- Ensures rate limits persist across restarts

## Restart Persistence Mechanism

### How Jobs Survive Restarts

**Problem:** Server crashes, jobs scheduled for future still need to send

**Solution:** Dual persistence in Redis + MySQL

**Scenario:** 1000 emails scheduled for tomorrow at 10 AM

```
┌──────────────────────────────────────────┐
│ Initial State (Before Crash)             │
├──────────────────────────────────────────┤
│ MySQL:                                   │
│   email_jobs table:                      │
│   - 1000 rows with status='scheduled'    │
│   - scheduled_time = tomorrow 10 AM      │
│                                          │
│ Redis:                                   │
│   BullMQ delayed queue:                  │
│   - 1000 jobs with delay until tomorrow  │
│   - Job data stored in Redis hashes      │
└──────────────────────────────────────────┘
          │
          │ 💥 Server crashes
          │
          ▼
┌──────────────────────────────────────────┐
│ After Restart                            │
├──────────────────────────────────────────┤
│ MySQL: ✅ PERSISTENT                     │
│   - 1000 rows still exist                │
│   - Data intact                          │
│                                          │
│ Redis: ✅ PERSISTENT (if configured)     │
│   - Redis persistence enabled (RDB/AOF)  │
│   - All jobs still in delayed queue      │
│   - Worker reconnects                    │
└──────────────────────────────────────────┘
          │
          │ Tomorrow 10 AM arrives
          │
          ▼
┌──────────────────────────────────────────┐
│ Jobs Process Successfully                │
├──────────────────────────────────────────┤
│ - BullMQ moves jobs to active queue      │
│ - Worker processes all 1000 emails       │
│ - MySQL updated to status='sent'         │
│ - Zero data loss! ✅                     │
└──────────────────────────────────────────┘
```

**Key Points:**
1. **Redis Persistence:** Enabled by default in our Docker setup
2. **MySQL Persistence:** Always persistent (disk-based)
3. **Job IDs:** UUIDs prevent duplicate processing
4. **Idempotency:** BullMQ uses jobId to deduplicate

**Configuration:**
```yaml
# docker-compose.yml
redis:
  volumes:
    - redis_data:/data  # Persistent volume
```

**Redis Persistence Modes:**
- **RDB (Snapshot):** Periodic disk snapshots
- **AOF (Append-Only File):** Logs every write
- **Both:** Maximum durability (our configuration)

## Concurrency & Performance

### Worker Concurrency

**Configuration:**
```typescript
concurrency: 5  // Process 5 jobs simultaneously
```

**How It Works:**
```
Worker Pool (5 concurrent jobs)
├── Job 1: Sending to user1@example.com
├── Job 2: Sending to user2@example.com
├── Job 3: Sending to user3@example.com
├── Job 4: Sending to user4@example.com
└── Job 5: Sending to user5@example.com

Queue (waiting jobs)
├── Job 6
├── Job 7
...
└── Job 1000
```

**Throughput Calculation:**
```
Base throughput = concurrency / send_time
= 5 jobs / 2 seconds
= 2.5 emails/second
= 150 emails/minute
= 9,000 emails/hour (theoretical max)

With rate limit = 200/hour:
Actual = min(9000, 200) = 200 emails/hour
```

### Load Handling: 1000+ Emails

**Scenario:** User schedules 1000 emails starting in 5 minutes

**System Response:**

1. **Enqueueing (< 5 seconds):**
   - API creates 1000 database records
   - Adds 1000 jobs to BullMQ queue
   - Each job has calculated delay

2. **Initial Burst (5 minutes later):**
   - First 200 emails send immediately (hourly limit)
   - Remaining 800 automatically rescheduled

3. **Subsequent Hours:**
   - Hour 2: Next 200 emails
   - Hour 3: Next 200 emails
   - Hour 4: Next 200 emails
   - Hour 5: Last 200 emails

4. **Worker Behavior:**
   - Processes 5 at a time (concurrency)
   - 2 second delay between each (throttle)
   - Rate limiter enforces 200/hour cap
   - Excess jobs moved to next hour window

**Visualization:**
```
Time    | Emails Sent | Queue Status
--------|-------------|-------------
00:00   | 0           | 1000 scheduled for 00:05
00:05   | 200         | 800 rescheduled to 01:05
01:05   | 200         | 600 rescheduled to 02:05
02:05   | 200         | 400 rescheduled to 03:05
03:05   | 200         | 200 rescheduled to 04:05
04:05   | 200         | 0 (complete)
--------|-------------|-------------
Total   | 1000        | ✅ All sent
```

## Security & Best Practices

### Authentication
- ✅ Google OAuth 2.0 (industry standard)
- ✅ Session-based authentication
- ✅ Secure session cookies (httpOnly, secure in production)
- ✅ CSRF protection via session middleware

### Data Protection
- ✅ User isolation (can only access own jobs)
- ✅ Parameterized SQL queries (SQL injection prevention)
- ✅ Input validation and sanitization
- ✅ Environment variables for secrets

### Error Handling
- ✅ Try-catch blocks in all async operations
- ✅ Detailed error logging
- ✅ Graceful degradation
- ✅ User-friendly error messages

### Performance
- ✅ Database connection pooling
- ✅ Redis connection reuse
- ✅ Efficient indexing
- ✅ Auto-cleanup of old jobs

## Scalability Considerations

### Current System (Single Instance)
- Handles 200 emails/hour per user
- Worker concurrency: 5
- Single Redis instance
- Single MySQL instance

### Scaling Options

**Horizontal Scaling (Multiple Workers):**
```
┌────────────┐  ┌────────────┐  ┌────────────┐
│  Worker 1  │  │  Worker 2  │  │  Worker 3  │
│ Concur: 5  │  │ Concur: 5  │  │ Concur: 5  │
└─────┬──────┘  └─────┬──────┘  └─────┬──────┘
      │               │               │
      └───────────────┴───────────────┘
                      │
              ┌───────▼────────┐
              │  Redis Queue   │
              │  (Shared)      │
              └────────────────┘
```

**Benefits:**
- 3x throughput (15 concurrent jobs)
- Fault tolerance (one worker fails, others continue)
- BullMQ handles coordination automatically

**Vertical Scaling (Bigger Instances):**
- Increase worker concurrency: 5 → 10 → 20
- More powerful Redis instance
- Larger MySQL instance

**Database Sharding:**
- Partition by user_id
- Separate databases per region
- Reduces single-point bottlenecks

## Technology Choices Rationale

### Why BullMQ over Cron?
- ✅ Persistent job storage
- ✅ Automatic retries
- ✅ Distributed workers
- ✅ Real-time monitoring
- ✅ No external dependencies
- ❌ Cron: Lost jobs on restart, no persistence

### Why Redis?
- ✅ In-memory speed
- ✅ Atomic operations
- ✅ Persistence options
- ✅ BullMQ integration
- ✅ Rate limiting counters

### Why MySQL over MongoDB?
- ✅ ACID transactions
- ✅ Relational data (users ↔ jobs)
- ✅ SQL queries for analytics
- ✅ Foreign key constraints
- ✅ Better for tabular data

### Why TypeScript?
- ✅ Type safety
- ✅ Better IDE support
- ✅ Fewer runtime errors
- ✅ Self-documenting code
- ✅ Production-ready

## Monitoring & Observability

### Metrics to Track

**System Health:**
- API response times
- Worker processing rate
- Queue depth
- Error rates

**Business Metrics:**
- Emails scheduled per day
- Emails sent per day
- Failure rate
- Average delivery time

**Implementation (Future):**
```typescript
// Example: Prometheus metrics
const emailsSentCounter = new Counter({
  name: 'emails_sent_total',
  help: 'Total emails sent'
});

const queueDepthGauge = new Gauge({
  name: 'queue_depth',
  help: 'Current queue depth'
});
```

### Logging Strategy

**Current:**
- Console logs in development
- Structured logging to stdout

**Production Ready:**
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

---

## Conclusion

This architecture provides:
- ✅ **Reliability**: Persistent queues, automatic retries, restart safety
- ✅ **Scalability**: Horizontal worker scaling, connection pooling
- ✅ **Performance**: Concurrent processing, rate limiting, efficient queries
- ✅ **Security**: OAuth, session management, SQL injection prevention
- ✅ **Maintainability**: TypeScript, clean architecture, separation of concerns

The system is production-ready and can handle thousands of emails per day with proper infrastructure scaling.
