import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:55321' // Legacy UI is isolated-only; never read hosted .env values.
const supabaseAnonKey = import.meta.env.VITE_PHASE6_ANON_KEY || 'local-setup-required'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}