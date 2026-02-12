#!/bin/bash

# Zenith CRM Deployment Script for Vercel

echo "🚀 Zenith CRM Deployment to Vercel"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx not found. Please install Node.js${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npx found${NC}"

# Step 2: Build the frontend
echo ""
echo -e "${YELLOW}Step 2: Building frontend...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Frontend built successfully${NC}"

# Step 3: Deploy to Vercel
echo ""
echo -e "${YELLOW}Step 3: Deploying to Vercel...${NC}"
echo "This will open a browser for authentication if needed."
echo ""

npx vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Open Vercel Dashboard"
    echo "2. Go to your project Settings → Environment Variables"
    echo "3. Add DATABASE_URL and SECRET_KEY"
    echo "4. Redeploy if environment variables were missing"
    echo ""
    echo "See DEPLOYMENT_GUIDE.md for detailed instructions"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi
