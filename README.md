# 🚀 ReachInbox Email Scheduler - Full Stack Application

A production-grade email scheduler service built with **TypeScript**, **Express.js**, **BullMQ**, **Redis**, **MySQL**, and **Next.js**. This system handles bulk email scheduling with intelligent rate limiting, persistent job queues, and graceful failure recovery.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Configuration](#configuration)
- [How It Works](#how-it-works)
- [Testing Restart Persistence](#testing-restart-persistence)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)

## ✨ Features

### Backend
- ✅ **BullMQ-based job scheduling** (no cron jobs)
- ✅ **Persistent email queues** with Redis
- ✅ **MySQL database** for job tracking
- ✅ **Configurable worker concurrency** (default: 5)
- ✅ **Rate limiting** (emails per hour, configurable)
- ✅ **Delay between emails** (minimum 2s throttling)
- ✅ **Automatic job rescheduling** when rate limit exceeded
- ✅ **Server restart persistence** - no data loss
- ✅ **Ethereal Email integration** for testing
- ✅ **Google OAuth authentication**
- ✅ **Idempotent job processing** (no duplicate sends)

### Frontend
- ✅ **Next.js 14** with TypeScript
- ✅ **Tailwind CSS** for styling
- ✅ **Google OAuth login** with user profile
- ✅ **Compose email modal** with CSV upload
- ✅ **Scheduled emails dashboard**
- ✅ **Sent emails history**
- ✅ **Real-time statistics**
- ✅ **Loading states & empty states**
- ✅ **Responsive design**

## 🛠 Tech Stack

### Backend
- **Language**: TypeScript
- **Framework**: Express.js
- **Queue**: BullMQ + Redis
- **Database**: MySQL 8.0
- **SMTP**: Ethereal Email (fake SMTP for testing)
- **Auth**: Passport.js with Google OAuth 2.0
- **ORM**: mysql2 with raw queries

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Icons**: Lucide React
- **Date Formatting**: date-fns

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Docker** and **Docker Compose** - [Download](https://www.docker.com/products/docker-desktop)
- **Git** - [Download](https://git-scm.com/)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd email-scheduler
```

### 2. Start Infrastructure (Redis & MySQL)

```bash
docker-compose up -d
```

This will start:
- MySQL on port `3306`
- Redis on port `6379`

Verify containers are running:
```bash
docker ps
```

### 3. Setup Backend

```bash
cd backend
npm install
```

Create `.env` file:
```bash
cp .env.example .env
```

**Important**: Edit `.env` and configure:

1. **Ethereal Email** (Get credentials from https://ethereal.email/):
```env
SMTP_USER=oren.tromp@ethereal.email
SMTP_PASSWORD=5QywB56b8REKurxXyK
```

2. **Google OAuth** (Get from https://console.cloud.google.com/):
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

3. **Database** (if using Docker defaults, keep as is):
```env
DB_PASSWORD=password123
```

Run database migrations:
```bash
npm run db:migrate
```

Start backend server:
```bash
npm run dev
```

Start BullMQ worker (in a separate terminal):
```bash
cd backend
npm run worker
```

Backend will run on: **http://localhost:3001**

### 4. Setup Frontend

```bash
cd frontend
npm install
```

Create `.env.local` file:
```bash
cp .env.local.example .env.local
```

Start frontend:
```bash
npm run dev
```

Frontend will run on: **http://localhost:3000**

### 5. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

Click **"Sign in with Google"** to authenticate.

## 🏗 Architecture Overview

### System Design

```
┌─────────────────┐
│   Next.js UI    │
│   (Frontend)    │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  Express API    │
│   (Backend)     │
└────┬────────┬───┘
     │        │
     │        └──────────┐
     ▼                   ▼
┌─────────┐      ┌──────────────┐
│  MySQL  │      │ Redis/BullMQ │
│Database │      │    Queue     │
└─────────┘      └──────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │  BullMQ Worker│
                │  (Processes   │
                │   Email Jobs) │
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │ Ethereal SMTP │
                │ Email Service │
                └───────────────┘
```

### How Scheduling Works

1. **User uploads CSV** with recipient emails via frontend
2. **Frontend sends** bulk schedule request to Express API
3. **Backend creates**:
   - Database record for each email (status: 'scheduled')
   - BullMQ delayed job with calculated delay
4. **BullMQ stores** job in Redis with delay metadata
5. **Worker processes** jobs when delay expires:
   - Checks rate limit (Redis counters)
   - If limit OK: sends email via SMTP
   - If limit exceeded: reschedules to next hour
6. **Database updated** with sent/failed status

### Persistence on Restart

**The magic**: All scheduled jobs are stored in both MySQL and Redis.

When server restarts:
1. ✅ **Redis** persists all BullMQ jobs (delayed queue intact)
2. ✅ **MySQL** has all job records with scheduled times
3. ✅ **Worker reconnects** to BullMQ and continues processing
4. ✅ **No jobs lost**, no duplicate sends (job IDs are unique)

**Test this**: Schedule emails for 10 minutes from now → Stop server → Start server → Emails still send!

### Rate Limiting Implementation

**Rate Limit Strategy**: Redis-backed counters with automatic rescheduling

```typescript
// Rate limit key format: rate_limit:{userId}:{YYYY-MM-DD-HH}
// Example: rate_limit:123:2024-02-06-14

1. Worker picks job from queue
2. Check Redis: INCR rate_limit:123:2024-02-06-14
3. If count > MAX_EMAILS_PER_HOUR:
   - Calculate next hour slot
   - Update scheduled_time in MySQL
   - Throw error to reschedule job
4. Else:
   - Send email
   - Record in database
```

**Configured via**:
- `MAX_EMAILS_PER_HOUR` (default: 200)
- `WORKER_CONCURRENCY` (default: 5)
- `MIN_DELAY_BETWEEN_EMAILS` (default: 2000ms)

### Concurrency & Throughput

**Worker Configuration**:
```typescript
concurrency: 5  // Process 5 jobs simultaneously
limiter: {
  max: 100,     // Max 100 jobs
  duration: 60000  // Per 60 seconds
}
```

**Behavior under load** (e.g., 1000 emails scheduled):
1. Jobs added to queue with incremental delays
2. Worker processes 5 at a time
3. Rate limiter enforces hourly quota
4. Excess jobs automatically moved to next hour window
5. Order preserved as much as possible

## 🔧 Configuration

### Backend Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password123
DB_NAME=email_scheduler

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# BullMQ Performance
WORKER_CONCURRENCY=5              # Parallel job processing
MIN_DELAY_BETWEEN_EMAILS=2000     # Milliseconds between sends
MAX_EMAILS_PER_HOUR=200           # Hourly rate limit

# SMTP (Ethereal)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_user@ethereal.email
SMTP_PASSWORD=your_password

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

# Session
SESSION_SECRET=your_random_secret_here

# Frontend
FRONTEND_URL=http://localhost:3000
```

### Getting Ethereal Email Credentials

1. Go to https://ethereal.email/
2. Click **"Create Ethereal Account"**
3. Copy the credentials:
   - Username (email)
   - Password
4. Paste into `.env` file
5. View sent emails at: https://ethereal.email/messages

### Setting Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth Client ID**
5. Configure OAuth consent screen
6. Set **Authorized redirect URIs**:
   ```
   http://localhost:3001/auth/google/callback
   ```
7. Copy **Client ID** and **Client Secret** to `.env`

## 🧪 Testing Restart Persistence

Follow these steps to verify the system survives restarts:

### Test Scenario

```bash
# 1. Schedule emails for 10 minutes from now
# Via frontend: Upload CSV, set start time = current time + 10 mins

# 2. Verify jobs are scheduled
# Check dashboard - should show "Scheduled" status

# 3. Stop the backend server
# Terminal 1: Ctrl+C (stop Express server)
# Terminal 2: Ctrl+C (stop BullMQ worker)

# 4. Wait a few seconds, then restart
cd backend
npm run dev        # Terminal 1
npm run worker     # Terminal 2

# 5. Wait for scheduled time
# Emails will still send at the correct time!

# 6. Check sent emails
# Dashboard will update to show "Sent" status
# Check Ethereal inbox for preview URLs
```

### What to Verify

✅ Jobs remain in "scheduled" status during downtime  
✅ Worker reconnects to Redis queue  
✅ Emails send at exact scheduled time  
✅ No duplicate sends (check job_id uniqueness)  
✅ Database shows correct sent_at timestamps  

## 📡 API Documentation

### Authentication Endpoints

#### `GET /auth/google`
Initiates Google OAuth flow

#### `GET /auth/google/callback`
OAuth callback handler (redirects to frontend)

#### `GET /auth/me`
Get current authenticated user
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://..."
  }
}
```

#### `POST /auth/logout`
Logout current user

### Email Endpoints (Authenticated)

#### `POST /api/emails/schedule`
Schedule bulk emails

**Request**: multipart/form-data
```
recipientFile: File (CSV/TXT)
subject: string
body: string
startTime: ISO date string
delayBetweenEmails: number (ms)
hourlyLimit: number
```

**Response**:
```json
{
  "message": "Successfully scheduled 10 emails",
  "jobIds": ["uuid1", "uuid2", ...],
  "recipientCount": 10,
  "startTime": "2024-02-06T15:00:00Z"
}
```

#### `GET /api/emails/scheduled`
Get all scheduled emails for current user

**Response**:
```json
{
  "jobs": [
    {
      "id": 1,
      "job_id": "uuid",
      "recipient_email": "user@example.com",
      "subject": "Hello",
      "scheduled_time": "2024-02-06T15:00:00Z",
      "status": "scheduled"
    }
  ]
}
```

#### `GET /api/emails/sent`
Get all sent/failed emails

#### `GET /api/emails/stats`
Get email statistics

**Response**:
```json
{
  "stats": {
    "total": 100,
    "scheduled": 20,
    "sent": 75,
    "failed": 5
  }
}
```

## 📁 Project Structure

```
email-scheduler/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts       # MySQL connection pool
│   │   │   ├── redis.ts          # Redis configuration
│   │   │   └── passport.ts       # Google OAuth setup
│   │   ├── database/
│   │   │   └── migrations/
│   │   │       └── run-migrations.ts  # Database schema
│   │   ├── middleware/
│   │   │   └── auth.ts           # Authentication middleware
│   │   ├── queues/
│   │   │   └── emailQueue.ts     # BullMQ queue setup
│   │   ├── routes/
│   │   │   ├── auth.ts           # Auth endpoints
│   │   │   └── emails.ts         # Email endpoints
│   │   ├── services/
│   │   │   ├── emailService.ts   # SMTP email sender
│   │   │   └── rateLimiter.ts    # Rate limiting logic
│   │   ├── types/
│   │   │   └── index.ts          # TypeScript interfaces
│   │   ├── workers/
│   │   │   └── emailWorker.ts    # BullMQ job processor
│   │   └── server.ts             # Express app entry
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx      # Dashboard page
│   │   │   ├── page.tsx          # Landing/login page
│   │   │   ├── layout.tsx        # Root layout
│   │   │   └── globals.css       # Global styles
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   └── Modal.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── ComposeEmailModal.tsx
│   │   │   └── EmailTable.tsx
│   │   ├── lib/
│   │   │   └── api.ts            # API client
│   │   └── types/
│   │       └── index.ts          # TypeScript types
│   ├── .env.local.example
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml            # Redis + MySQL containers
├── sample-recipients.csv         # Test data
└── README.md
```

## 🎯 Features Implemented

### Backend (✅ All Requirements Met)

- [x] TypeScript + Express.js
- [x] BullMQ delayed jobs (NO cron)
- [x] Redis-backed persistent queues
- [x] MySQL database with proper schema
- [x] Ethereal Email SMTP integration
- [x] Server restart persistence
- [x] Worker concurrency (configurable)
- [x] Delay between emails (throttling)
- [x] Emails per hour rate limiting
- [x] Redis-based rate limit counters
- [x] Automatic job rescheduling on rate limit
- [x] Safe concurrent job processing
- [x] Idempotent email sends (no duplicates)
- [x] Google OAuth authentication
- [x] CSV file parsing
- [x] Comprehensive error handling

### Frontend (✅ All Requirements Met)

- [x] Next.js 14 + TypeScript
- [x] Tailwind CSS styling
- [x] Google OAuth login flow
- [x] User profile display (name, email, avatar)
- [x] Logout functionality
- [x] Dashboard with tabs
- [x] Compose email modal
- [x] CSV file upload with email count
- [x] Scheduled emails table
- [x] Sent emails table
- [x] Loading states
- [x] Empty states
- [x] Real-time statistics
- [x] Responsive design
- [x] Clean component structure
- [x] DRY code principles
- [x] TypeScript interfaces for all data

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### MySQL Connection Failed
```bash
# Check Docker container
docker ps

# Restart MySQL
docker-compose restart mysql

# Check logs
docker logs email-scheduler-mysql
```

### Redis Connection Failed
```bash
# Restart Redis
docker-compose restart redis

# Check logs
docker logs email-scheduler-redis
```

### BullMQ Jobs Not Processing
```bash
# Make sure worker is running
npm run worker

# Check Redis connection
redis-cli ping
```

## 📝 Notes & Assumptions

1. **Email Validation**: Basic regex validation for email addresses
2. **Rate Limiting**: Global rate limit per user (can be extended per-sender)
3. **Error Handling**: Failed jobs are retried 3 times with exponential backoff
4. **CSV Format**: Flexible - detects emails from any column
5. **Time Zones**: All times stored in UTC in database
6. **Production**: For production, use environment-specific Redis/MySQL (not Docker)

## 🎬 Demo Video Checklist

✅ Show Google login flow  
✅ Upload CSV and show email count  
✅ Schedule emails with custom delay/limit  
✅ Show scheduled emails table  
✅ Wait for emails to send  
✅ Show sent emails table  
✅ **Restart scenario**:  
   - Schedule emails for future  
   - Stop backend + worker  
   - Restart both  
   - Verify emails still send  
✅ Show Ethereal preview URLs  

## 📄 License

MIT License - feel free to use this project for learning and interviews.

---

Built with ❤️ for ReachInbox Assignment
