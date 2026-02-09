import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ornwvpbgmsvcobzgpbwm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ybnd2cGJnbXN2Y29iemdwYndtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NTIxMTMsImV4cCI6MjA4MTUyODExM30.XW4_w6vPhdHn1UtFean6KExw3X1JK1eJyoN3X6p-skw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
