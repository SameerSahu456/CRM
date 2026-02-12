# Zenith CRM Deployment Guide

## Prerequisites
1. Supabase account with a project created
2. Vercel account
3. Vercel CLI installed: `npm i -g vercel`

## Step 1: Database Migration (CRITICAL - Do This First!)

1. Open **Supabase Dashboard** → Your Project → **SQL Editor**
2. Copy the entire contents of `backend/supabase_migration.sql`
3. Paste into SQL Editor and click **Run**
4. Verify all 17+ tables were created successfully

**Important**: The migration will:
- Drop all existing tables (if any)
- Create all tables including the new deals fields
- Create deal_line_items table
- Seed the admin user (admin@gmail.com / password: 1)

## Step 2: Get Supabase Connection String

1. In Supabase Dashboard → **Project Settings** → **Database**
2. Scroll to **Connection String** → **Connection Pooling** (recommended for serverless)
3. Copy the URI (should look like):
   ```
   postgresql://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres
   ```
4. **IMPORTANT**: Replace `[YOUR-PASSWORD]` with your actual database password

## Step 3: Set Up Environment Variables in Vercel

You need to configure these environment variables:

### Required Variables:
- **DATABASE_URL**: Your Supabase connection string (from Step 2)
  - Use the **Connection Pooling** URL for better performance
  - Format: `postgresql+asyncpg://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres`
  - Note: Change `postgresql://` to `postgresql+asyncpg://` for SQLAlchemy async

- **SECRET_KEY**: Generate a secure random key
  - Run: `openssl rand -hex 32`
  - Or use: https://generate-secret.vercel.app/32

### Optional Variables:
- **DEBUG**: `false` (already default in production)
- **ACCESS_TOKEN_EXPIRE_MINUTES**: `60` (default)

## Step 4: Deploy to Vercel

### Option A: Deploy via Vercel CLI (Recommended)

```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (first time will ask for configuration)
vercel

# For production deployment
vercel --prod
```

### Option B: Deploy via Git Integration

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "feat: Add comprehensive deal fields with line items"
   git push
   ```

2. In Vercel Dashboard:
   - Click **Add New** → **Project**
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Vite
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

3. Add Environment Variables:
   - Go to **Settings** → **Environment Variables**
   - Add `DATABASE_URL` and `SECRET_KEY`
   - Make sure to select all environments (Production, Preview, Development)

4. Click **Deploy**

## Step 5: Verify Deployment

1. **Check Backend Health**:
   ```bash
   curl https://your-app.vercel.app/api/status
   # Should return: {"status":"ok","version":"1.0.0","engine":"FastAPI"}
   ```

2. **Test Login**:
   - Open https://your-app.vercel.app
   - Login with: `admin@gmail.com` / `1`

3. **Test New Deal Fields**:
   - Navigate to Deals
   - Create a new deal
   - Verify all 35 new fields are available
   - Add line items to test Product Info section

## Troubleshooting

### Error: "relation 'partners' does not exist"
- You forgot to run the Supabase migration first
- Go back to Step 1 and run the migration

### Error: "Connection refused" or "Database connection failed"
- Check your DATABASE_URL is correct
- Make sure you're using the Connection Pooling URL
- Verify the password is correct in the connection string

### Error: "Invalid token" or "Not authenticated"
- Check SECRET_KEY is set in Vercel environment variables
- Clear browser cache and try logging in again

### Frontend shows but API calls fail
- Check Network tab in browser DevTools
- Verify `/api/*` routes are being proxied correctly
- Check Vercel function logs for backend errors

## Post-Deployment

### Update CORS Origins (if needed)
If deploying to a custom domain, update `backend/app/config.py`:
```python
CORS_ORIGINS: List[str] = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://your-custom-domain.com"
]
```

### Monitor Performance
- Vercel Dashboard → Your Project → **Analytics**
- Check function duration (should be < 10s)
- Monitor database connection pool in Supabase

### Database Backups
- Supabase automatically backs up your database
- To create manual backup: Supabase Dashboard → Database → Backups

## Environment Variables Summary

Create a `.env.production` file locally (not committed to git):

```env
DATABASE_URL=postgresql+asyncpg://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres
SECRET_KEY=your-generated-secret-key-here
DEBUG=false
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

## Architecture Notes

- **Frontend**: React 19 + Vite → Deployed as static site
- **Backend**: FastAPI → Deployed as Vercel serverless function at `/api/*`
- **Database**: Supabase PostgreSQL (already deployed)
- **Authentication**: JWT tokens with bcrypt password hashing

## File Structure
```
.
├── api/
│   └── index.py          # Vercel serverless function wrapper
├── backend/
│   ├── app/
│   │   ├── main.py       # FastAPI app
│   │   ├── config.py     # Environment configuration
│   │   ├── models/       # SQLAlchemy models (Deal, DealLineItem, etc.)
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── repositories/ # Database repositories
│   │   └── api/          # API endpoints
│   └── supabase_migration.sql  # Database schema
├── components/           # React components
├── dist/                 # Build output (auto-generated)
├── vercel.json          # Vercel configuration
└── package.json         # Frontend dependencies
```

## Success Checklist

- [ ] Supabase migration completed successfully
- [ ] Environment variables set in Vercel
- [ ] Deployment successful (no errors in Vercel logs)
- [ ] Can access https://your-app.vercel.app
- [ ] Health check endpoint works: `/api/status`
- [ ] Can login with admin credentials
- [ ] Can create deals with new fields
- [ ] Line items can be added to deals
- [ ] All 35 new fields save correctly

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- FastAPI Docs: https://fastapi.tiangolo.com

---

**Ready to Deploy!** 🚀

Start with Step 1 (Database Migration) and follow through Step 4 to deploy.
