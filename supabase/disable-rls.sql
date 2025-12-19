-- Disable Row Level Security on all tables to allow inserts/updates/deletes
-- Run this in Supabase SQL Editor

ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE emails DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- OR if you want to keep RLS enabled but allow all operations with anon key:
-- CREATE POLICY "Allow all for anon" ON leads FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all for anon" ON contacts FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all for anon" ON accounts FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all for anon" ON deals FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all for anon" ON tasks FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all for anon" ON calendar_events FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all for anon" ON tickets FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all for anon" ON campaigns FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all for anon" ON emails FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all for anon" ON notifications FOR ALL USING (true) WITH CHECK (true);
