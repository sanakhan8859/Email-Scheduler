#!/bin/bash

echo "🚀 ReachInbox Email Scheduler - Setup Script"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"
echo ""

# Start Docker containers
echo -e "${YELLOW}📦 Starting Redis and MySQL containers...${NC}"
docker-compose up -d

# Wait for containers to be healthy
echo -e "${YELLOW}⏳ Waiting for containers to be ready...${NC}"
sleep 10

# Check container status
if docker ps | grep -q email-scheduler-mysql && docker ps | grep -q email-scheduler-redis; then
    echo -e "${GREEN}✅ Containers are running${NC}"
else
    echo -e "${RED}❌ Containers failed to start. Check docker logs.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📝 Setting up Backend...${NC}"

# Backend setup
cd backend

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file from .env.example${NC}"
    echo -e "${YELLOW}⚠️  Please edit backend/.env and add:${NC}"
    echo "   - Ethereal Email credentials (from https://ethereal.email/)"
    echo "   - Google OAuth credentials (from https://console.cloud.google.com/)"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Install backend dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Backend dependencies already installed${NC}"
fi

# Run migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
npm run db:migrate
echo -e "${GREEN}✅ Database migrations completed${NC}"

cd ..

echo ""
echo -e "${YELLOW}📝 Setting up Frontend...${NC}"

# Frontend setup
cd frontend

if [ ! -f ".env.local" ]; then
    cp .env.local.example .env.local
    echo -e "${GREEN}✅ Created .env.local file${NC}"
else
    echo -e "${GREEN}✅ .env.local file already exists${NC}"
fi

# Install frontend dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Frontend dependencies already installed${NC}"
fi

cd ..

echo ""
echo -e "${GREEN}✅ Setup completed!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Edit backend/.env and add your credentials:"
echo "   - Ethereal Email: https://ethereal.email/"
echo "   - Google OAuth: https://console.cloud.google.com/"
echo ""
echo "2. Start the backend server:"
echo "   cd backend && npm run dev"
echo ""
echo "3. Start the BullMQ worker (in a new terminal):"
echo "   cd backend && npm run worker"
echo ""
echo "4. Start the frontend (in a new terminal):"
echo "   cd frontend && npm run dev"
echo ""
echo "5. Open http://localhost:3000 in your browser"
echo ""
echo -e "${GREEN}Happy coding! 🎉${NC}"
