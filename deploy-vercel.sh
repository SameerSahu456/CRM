#!/bin/bash

# Deployment script for Comprint CRM to Vercel
# This script helps you deploy the application step-by-step

set -e  # Exit on error

echo "🚀 Comprint CRM - Vercel Deployment Script"
echo "=========================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found!"
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
    echo "✅ Vercel CLI installed!"
    echo ""
fi

# Check if logged in
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "Please login to Vercel:"
    vercel login
fi
echo "✅ Authenticated!"
echo ""

# Verify environment variables
echo "⚙️  Environment Variables Checklist:"
echo "-----------------------------------"
echo "Make sure you have these ready:"
echo ""
echo "1. DATABASE_URL (from Supabase)"
echo "   Format: postgresql+asyncpg://postgres.xxxxx:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres"
echo ""
echo "2. SECRET_KEY (generate with: openssl rand -hex 32)"
echo ""
echo "3. CORS_ORIGINS_STR (will be updated after first deploy)"
echo ""
read -p "Do you have these variables ready? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please prepare your environment variables first."
    echo "See .env.production for the template."
    exit 1
fi

echo "✅ Environment variables ready!"
echo ""

# Deploy to Vercel
echo "🚀 Starting deployment..."
echo "Project name will be: comprint-crm"
echo ""

# First deployment (this will create the project)
vercel --name comprint-crm --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next Steps:"
echo "-------------"
echo "1. Go to Vercel Dashboard: https://vercel.com/dashboard"
echo "2. Select 'comprint-crm' project"
echo "3. Go to Settings → Environment Variables"
echo "4. Add the following variables (for Production, Preview, and Development):"
echo ""
echo "   Variable Name          | Value"
echo "   ----------------------|----------------------------------------"
echo "   DATABASE_URL          | postgresql+asyncpg://postgres.wnkidelrhkvagghaftnf:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres"
echo "   SECRET_KEY            | (output of: openssl rand -hex 32)"
echo "   CORS_ORIGINS_STR      | http://localhost:3000,http://localhost:5173,https://comprint-crm.vercel.app"
echo ""
echo "5. After adding variables, trigger a redeploy from the Deployments tab"
echo ""
echo "6. Test your deployment:"
echo "   - Visit: https://comprint-crm.vercel.app"
echo "   - Login with: admin@gmail.com / password: 1"
echo ""
echo "🎉 Done! Your CRM is now live!"
