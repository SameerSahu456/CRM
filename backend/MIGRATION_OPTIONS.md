# Migration Options - Choose Based on Your Situation

## Option 1: Incremental Migration (SAFE - Preserves Data)

**Use this if:** You have existing data you want to keep

**File:** `backend/incremental_migration.sql`

**Steps:**
1. Open Supabase SQL Editor
2. Copy entire contents of `incremental_migration.sql`
3. Paste and click **Run**
4. Check for errors in the output panel
5. Run `verify_schema.sql` to confirm columns were added

---

## Option 2: Full Schema Reset (DESTRUCTIVE - Deletes All Data)

**Use this if:** 
- Incremental migration failed
- You're okay losing all existing data
- This is a fresh/test database

**File:** `backend/supabase_migration.sql`

**⚠️ WARNING:** This will DELETE ALL your data!

**Steps:**
1. **Backup your data first** (if needed):
   ```sql
   -- Export important data
   COPY accounts TO '/tmp/accounts_backup.csv' CSV HEADER;
   COPY deals TO '/tmp/deals_backup.csv' CSV HEADER;
   ```

2. Open Supabase SQL Editor

3. Copy entire contents of `supabase_migration.sql`

4. Paste and click **Run**

5. This will:
   - DROP all existing tables
   - CREATE all tables with correct schema
   - Seed admin user (admin@gmail.com / 1)

---

## Option 3: Manual Column Addition (Targeted Fix)

**Use this if:** Only specific columns are missing

**Create and run this script in Supabase SQL Editor:**

```sql
-- Add only the specific missing columns you identified

-- Example: If only account_image is missing:
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_image VARCHAR(500);

-- Example: If only deals new fields are missing:
ALTER TABLE deals ADD COLUMN IF NOT EXISTS sdp_no VARCHAR(100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS expected_revenue NUMERIC(15,2);
-- ... add other missing columns

-- Create deal_line_items if missing:
CREATE TABLE IF NOT EXISTS deal_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    product_category VARCHAR(100),
    product_sub_category VARCHAR(100),
    part_number VARCHAR(255),
    description TEXT,
    quantity INTEGER DEFAULT 1,
    pricing NUMERIC(15,2),
    total_price NUMERIC(15,2),
    warehouse VARCHAR(100),
    total_rental NUMERIC(15,2),
    rental_per_unit NUMERIC(15,2),
    sort_order INTEGER DEFAULT 0
);
```

---

## After Running Any Migration

### 1. Verify Schema
Run `verify_schema.sql` to confirm all columns exist

### 2. Restart Backend Server
```bash
# If running locally
cd backend
# Kill the running uvicorn process, then:
python3 -m uvicorn app.main:app --reload --port 3002

# If deployed to Vercel
# Just redeploy:
npx vercel --prod
```

### 3. Test the Fix
```bash
# Test API health
curl http://localhost:3002/api/status

# Or for Vercel:
curl https://your-app.vercel.app/api/status
```

### 4. Clear Any Caches
```bash
# Clear browser cache
# Open DevTools → Application → Clear Storage → Clear site data

# Or just hard refresh:
# Ctrl+Shift+R (Windows/Linux)
# Cmd+Shift+R (Mac)
```

---

## Common Issues & Solutions

### Issue: "Column already exists"
**Solution:** This is actually GOOD - means the migration partially worked. Ignore the error and continue.

### Issue: "Relation 'table_name' does not exist"
**Solution:** The table wasn't created. Run the full migration (Option 2).

### Issue: Migration runs but columns still missing
**Solutions:**
1. Check you're in the correct Supabase project
2. Check you're running in the correct database (postgres vs custom)
3. Try running the migration again
4. Check the Supabase logs for errors

### Issue: Backend still shows old schema
**Solutions:**
1. Restart the backend server
2. Clear SQLAlchemy connection pool
3. Redeploy to Vercel (if deployed)
4. Check DATABASE_URL is pointing to the right database

---

## Verification Checklist

After migration, verify these:

- [ ] Run `verify_schema.sql` - all columns show as existing
- [ ] `accounts` table has ~47 columns
- [ ] `deals` table has ~52 columns
- [ ] `deal_line_items` table exists
- [ ] Backend server restarted
- [ ] API health check works: `/api/status`
- [ ] Can fetch accounts without error: `/api/v1/accounts`
- [ ] Can fetch deals without error: `/api/v1/deals`
- [ ] Can create a deal with new fields

---

## Still Having Issues?

### Debug Checklist:

1. **Are you in the right Supabase project?**
   - Check the project URL in your browser
   - Check DATABASE_URL matches this project

2. **Are you running the SQL as the right user?**
   - Supabase SQL Editor runs as `postgres` by default (correct)
   - If using external tool, ensure you have admin rights

3. **Did the migration actually complete?**
   - Look for green "Success" message in Supabase
   - Check for any red error messages
   - Scroll through the output to see what succeeded

4. **Is the backend connected to the same database?**
   - Check your `.env` or Vercel environment variables
   - Verify DATABASE_URL matches your Supabase project

5. **Need to see the actual error?**
   - Check Vercel function logs
   - Check local backend console output
   - Look for the full stack trace

---

## Need More Help?

Share the following info:

1. Output from running `verify_schema.sql`
2. Any error messages from the migration
3. Which option you tried (1, 2, or 3)
4. Full error message from your backend/Vercel logs

