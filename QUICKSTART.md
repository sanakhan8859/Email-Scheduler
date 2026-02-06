# ⚡ Quick Start Guide

Get the Email Scheduler running in **5 minutes**!

## 1️⃣ Prerequisites Check

```bash
# Check Node.js (need v18+)
node --version

# Check Docker
docker --version

# Check Docker Compose
docker-compose --version
```

If any are missing, install them first.

## 2️⃣ Automated Setup (Recommended)

```bash
# Run the setup script
./setup.sh
```

This will:
- ✅ Start Redis and MySQL containers
- ✅ Install all dependencies
- ✅ Run database migrations
- ✅ Create .env files

## 3️⃣ Configure Credentials

### Get Ethereal Email Credentials (2 minutes)

1. Visit https://ethereal.email/
2. Click "Create Ethereal Account"
3. Copy the username and password
4. Edit `backend/.env`:
```env
SMTP_USER=your-username@ethereal.email
SMTP_PASSWORD=your-password
```

### Get Google OAuth Credentials (5 minutes)

1. Go to https://console.cloud.google.com/
2. Create a new project (or use existing)
3. Enable Google+ API
4. Go to Credentials → Create OAuth Client ID
5. Set Authorized redirect URI: `http://localhost:3001/auth/google/callback`
6. Copy Client ID and Secret
7. Edit `backend/.env`:
```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

## 4️⃣ Start the Application

Open **3 terminals**:

**Terminal 1 - Backend API:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Email Worker:**
```bash
cd backend
npm run worker
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

## 5️⃣ Access the App

Open your browser:
```
http://localhost:3000
```

Click **"Sign in with Google"** and you're ready! 🎉

## 6️⃣ Send Your First Email Campaign

1. Click **"Compose New Email"**
2. Fill in:
   - Subject: "Test Campaign"
   - Body: "Hello from ReachInbox!"
   - Upload: `sample-recipients.csv` (provided)
   - Start Time: Current time + 5 minutes
   - Delay: 5000ms
   - Hourly Limit: 200
3. Click **"Schedule Emails"**
4. Check the **Scheduled** tab - you'll see 6 emails queued
5. Wait 5 minutes...
6. Check the **Sent** tab - emails are sent!
7. Visit https://ethereal.email/messages to see preview links

## 🧪 Test Restart Persistence

1. Schedule emails for 10 minutes from now
2. Stop backend & worker (Ctrl+C in both terminals)
3. Wait 2-3 minutes
4. Restart both: `npm run dev` and `npm run worker`
5. Emails will still send at the scheduled time! ✅

## 🆘 Troubleshooting

**Port 3000 in use:**
```bash
lsof -ti:3000 | xargs kill -9
```

**Port 3001 in use:**
```bash
lsof -ti:3001 | xargs kill -9
```

**MySQL connection failed:**
```bash
docker-compose restart mysql
docker logs email-scheduler-mysql
```

**Redis connection failed:**
```bash
docker-compose restart redis
docker logs email-scheduler-redis
```

**Can't login with Google:**
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `backend/.env`
- Make sure redirect URI is exactly: `http://localhost:3001/auth/google/callback`
- Check Google Cloud Console OAuth settings

## 📊 Monitoring

**Backend API:** http://localhost:3001/health  
**Database:** Connect to MySQL on `localhost:3306`  
**Redis:** Connect to Redis on `localhost:6379`  
**Ethereal Inbox:** https://ethereal.email/messages

## 🎬 Demo Checklist

For your assignment video:
- [ ] Show Google login
- [ ] Upload CSV file (show email count)
- [ ] Schedule emails
- [ ] Show Scheduled table
- [ ] Wait for emails to send
- [ ] Show Sent table
- [ ] **RESTART TEST**: Schedule future emails → Stop server → Restart → Verify they still send
- [ ] Show Ethereal preview URLs

---

Need help? Check the full README.md for detailed documentation!
