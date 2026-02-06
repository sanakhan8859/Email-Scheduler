# 📖 Complete Setup & Run Instructions

This guide will walk you through setting up and running the ReachInbox Email Scheduler from scratch.

## 📋 What You'll Need

- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop))
- A **Google account** (for OAuth)
- 30 minutes of your time ⏱️

---

## 🚀 Step-by-Step Setup

### Step 1: Extract the Project

```bash
# Navigate to where you extracted the files
cd email-scheduler
```

You should see this structure:
```
email-scheduler/
├── backend/
├── frontend/
├── docker-compose.yml
├── README.md
└── setup.sh
```

### Step 2: Start Infrastructure

Start Redis and MySQL using Docker:

```bash
# Make sure Docker Desktop is running first!
docker-compose up -d
```

**Verify containers are running:**
```bash
docker ps
```

You should see:
- `email-scheduler-mysql` (port 3306)
- `email-scheduler-redis` (port 6379)

**Troubleshooting:**
- If containers don't start, check if ports 3306 or 6379 are already in use
- Check Docker Desktop is running
- Try: `docker-compose down` then `docker-compose up -d` again

### Step 3: Backend Setup

```bash
cd backend
```

#### A. Install Dependencies

```bash
npm install
```

This will take 2-3 minutes to download all packages.

#### B. Configure Environment

```bash
cp .env.example .env
```

Now edit the `.env` file. You need to configure:

**1. Ethereal Email (for testing SMTP):**

Visit https://ethereal.email/ and click "Create Ethereal Account". You'll get:
```
Username: john.smith1234@ethereal.email
Password: abc123xyz456
```

Add to `.env`:
```env
SMTP_USER=john.smith1234@ethereal.email
SMTP_PASSWORD=abc123xyz456
```

**2. Google OAuth:**

Follow these steps carefully:

1. Go to https://console.cloud.google.com/
2. Click "Select a project" → "New Project"
3. Name it "Email Scheduler" → Create
4. Wait for creation, then select the project
5. In the search bar, type "Google+ API" → Enable it
6. Go to "Credentials" (left sidebar)
7. Click "Create Credentials" → "OAuth Client ID"
8. If prompted, configure OAuth consent screen:
   - User Type: External
   - App name: Email Scheduler
   - User support email: your email
   - Developer contact: your email
   - Save and Continue → Save and Continue → Save and Continue
9. Back to Credentials → Create OAuth Client ID:
   - Application type: Web application
   - Name: Email Scheduler
   - Authorized redirect URIs: `http://localhost:3001/auth/google/callback`
   - Create
10. Copy the Client ID and Client Secret

Add to `.env`:
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcd1234efgh5678
```

**3. Database (already set if using Docker):**

The defaults should work:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password123
DB_NAME=email_scheduler
```

**4. Session Secret:**

Generate a random string (or use a password generator):
```env
SESSION_SECRET=my-super-secret-random-string-change-this-in-production
```

#### C. Run Database Migrations

```bash
npm run db:migrate
```

You should see:
```
✅ All tables created successfully
Migration completed
```

**Troubleshooting:**
- If connection fails, check Docker MySQL is running: `docker logs email-scheduler-mysql`
- Make sure DB_PASSWORD in .env matches docker-compose.yml

### Step 4: Frontend Setup

Open a **NEW terminal** and:

```bash
cd frontend  # (from project root)
```

#### A. Install Dependencies

```bash
npm install
```

#### B. Configure Environment

```bash
cp .env.local.example .env.local
```

The default should work:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Step 5: Run the Application

You need **3 terminals** running simultaneously:

#### Terminal 1 - Backend API

```bash
cd backend
npm run dev
```

Wait for:
```
🚀 Server running on http://localhost:3001
📧 Email Scheduler API ready
🔐 Google OAuth configured
```

#### Terminal 2 - BullMQ Worker

```bash
cd backend
npm run worker
```

Wait for:
```
🚀 Email worker started with concurrency: 5
⏱️  Minimum delay between emails: 2000ms
```

#### Terminal 3 - Frontend

```bash
cd frontend
npm run dev
```

Wait for:
```
✓ Ready in 3.2s
○ Local:   http://localhost:3000
```

---

## 🎉 Using the Application

### First Login

1. Open http://localhost:3000 in your browser
2. Click **"Sign in with Google"**
3. You'll be redirected to Google
4. Select your Google account
5. Click "Continue" to authorize
6. You'll be redirected back to http://localhost:3000/dashboard

### Schedule Your First Email Campaign

1. Click **"Compose New Email"** button
2. Fill in the form:
   - **Subject**: "Welcome to ReachInbox!"
   - **Body**: "This is a test email from our scheduler"
   - **Upload File**: Click "Choose File" → select `sample-recipients.csv` (in project root)
   - You should see: `(6 emails)` detected
   - **Start Time**: Click the input → select current date/time + 5 minutes
   - **Delay Between Emails**: 5000 (5 seconds between each email)
   - **Hourly Limit**: 200
3. Click **"Schedule Emails"**
4. You'll see a success message: "Successfully scheduled 6 emails"

### Monitor Your Emails

**Scheduled Tab:**
- Shows all emails waiting to be sent
- Updates automatically every 10 seconds
- You'll see 6 rows with "Scheduled" status

**After 5 minutes:**
- Switch to **Sent** tab
- You'll see emails moving to "Sent" status
- Check the statistics at the top

**View Sent Emails:**
1. Go to https://ethereal.email/messages
2. Log in with the credentials from your `.env` (SMTP_USER and SMTP_PASSWORD)
3. You'll see all sent emails with preview links

### Test Restart Persistence (IMPORTANT FOR DEMO!)

This proves the system survives crashes:

1. Schedule emails for **10 minutes from now**:
   - Start Time: current time + 10 minutes
   - Upload `sample-recipients.csv`
2. Verify they appear in "Scheduled" tab
3. **Stop the backend** (Ctrl+C in Terminal 1)
4. **Stop the worker** (Ctrl+C in Terminal 2)
5. Wait 2-3 minutes
6. **Restart backend**: `npm run dev` in Terminal 1
7. **Restart worker**: `npm run worker` in Terminal 2
8. Wait for the scheduled time
9. ✅ **Emails will still send!** Check "Sent" tab and Ethereal inbox

---

## 📊 Monitoring & Debugging

### Check Backend Health

```bash
curl http://localhost:3001/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-02-06T10:30:00.000Z",
  "service": "email-scheduler-api"
}
```

### Check MySQL

```bash
# Connect to MySQL
docker exec -it email-scheduler-mysql mysql -uroot -ppassword123 email_scheduler

# Run queries
SELECT COUNT(*) FROM email_jobs;
SELECT * FROM email_jobs ORDER BY created_at DESC LIMIT 5;
```

### Check Redis

```bash
# Connect to Redis
docker exec -it email-scheduler-redis redis-cli

# Check keys
KEYS *
GET rate_limit:1:2024-02-06-10
```

### View Worker Logs

The worker terminal shows real-time processing:
```
🔄 Processing job abc-123 for john@example.com
📧 Email sent: abc-123
🔗 Preview URL: https://ethereal.email/message/...
✅ Job abc-123 completed successfully
```

### View Ethereal Emails

1. Go to https://ethereal.email/messages
2. Login with your SMTP credentials
3. See all sent emails with live previews

---

## 🛑 Stopping the Application

```bash
# Stop each terminal with Ctrl+C

# Stop Docker containers
docker-compose down

# To completely remove data
docker-compose down -v
```

---

## 🎬 Recording Your Demo Video

For the assignment submission, record:

1. **Login** (20 seconds)
   - Show Google OAuth flow
   - Show dashboard with your profile

2. **Schedule Emails** (1 minute)
   - Upload CSV
   - Show email count
   - Set parameters
   - Submit form

3. **Monitor Scheduled** (30 seconds)
   - Show scheduled table
   - Show statistics updating

4. **Show Sent Emails** (30 seconds)
   - Wait for sending or fast-forward
   - Show sent table
   - Open Ethereal to show preview

5. **RESTART TEST** (2 minutes) - **CRITICAL!**
   - Schedule emails for 5 mins future
   - Show in scheduled table
   - Stop backend + worker (show terminals)
   - Wait 1 minute
   - Restart both (show terminals)
   - Wait for send time
   - Show emails sent successfully
   - Explain: "Persistence works!"

6. **Code Overview** (1 minute)
   - Quick tour of backend structure
   - Show BullMQ worker
   - Show rate limiter
   - Show frontend components

**Total: ~5 minutes**

---

## 🆘 Common Issues & Solutions

### "Cannot connect to MySQL"
```bash
# Check container
docker ps | grep mysql

# Restart
docker-compose restart mysql

# Check logs
docker logs email-scheduler-mysql
```

### "Cannot connect to Redis"
```bash
# Check container
docker ps | grep redis

# Restart
docker-compose restart redis
```

### "Port 3000 already in use"
```bash
# Kill the process
lsof -ti:3000 | xargs kill -9

# Or use different port
# In frontend: npm run dev -- -p 3001
```

### "Emails not sending"
- Check worker is running (`npm run worker`)
- Check worker terminal for errors
- Verify Redis connection
- Check rate limits in .env
- Verify Ethereal credentials

### "Google OAuth error"
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Check redirect URI is exactly: `http://localhost:3001/auth/google/callback`
- Ensure Google+ API is enabled

### "CSV not parsing"
- Make sure CSV has email addresses
- Check file format (UTF-8)
- Try the provided `sample-recipients.csv`

---

## ✅ Pre-Submission Checklist

Before submitting your assignment:

- [ ] All terminals running without errors
- [ ] Can login with Google
- [ ] Can schedule emails
- [ ] Emails appear in Scheduled tab
- [ ] Emails send successfully
- [ ] Emails appear in Sent tab
- [ ] Can view emails in Ethereal
- [ ] **Restart test passes** (most important!)
- [ ] Demo video recorded (max 5 mins)
- [ ] README.md updated with your credentials (remove sensitive data first!)
- [ ] GitHub repo is private
- [ ] Access granted to user `Mitrajit`
- [ ] Form submitted: https://forms.gle/PstJgufbi5Qn3y5X9

---

## 📞 Need Help?

If you encounter issues:

1. Check this guide thoroughly
2. Read the main README.md
3. Check terminal logs for error messages
4. Google the specific error
5. Check Docker container logs
6. Verify all .env variables

---

## 🎯 Success Criteria

You've succeeded if:

✅ Backend API runs on :3001  
✅ Worker processes jobs  
✅ Frontend runs on :3000  
✅ Can login with Google  
✅ Can schedule emails via UI  
✅ Emails send via Ethereal  
✅ **System survives restart without losing jobs**  
✅ Rate limiting works  
✅ All data persists in MySQL  

---

Good luck with your assignment! 🚀
