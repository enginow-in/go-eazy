import { createClient } from '@supabase/supabase-js'

const envUrl = import.meta.env.VITE_SUPABASE_URL
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabaseUrl = envUrl?.startsWith('http') ? envUrl : 'https://placeholder.supabase.co'
const supabaseKey = envKey && envKey !== 'your_supabase_anon_key' ? envKey : 'placeholder-anon-key'

export const isDemoMode = !envUrl?.startsWith('http') || envKey === 'your_supabase_anon_key'

if (isDemoMode) {
  console.warn('⚠️ Valid Supabase credentials missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file to link the real backend. Currently running with mock data fallback.')
}

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)
