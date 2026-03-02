import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://fvfviudlxyumnskakftp.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2ZnZpdWRseHl1bW5za2FrZnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMjExMDEsImV4cCI6MjA3ODg5NzEwMX0.fODOqTUm9g_20Jbxz5J5s_L-PwcH-mKfNp_3741fAnA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}
