import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if Supabase is properly configured (not placeholder values)
const isConfigured =
  SUPABASE_URL &&
  SUPABASE_KEY &&
  SUPABASE_URL.startsWith('https://') &&
  SUPABASE_URL.includes('.supabase.co')

let _client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!isConfigured) {
    // Return a mock client for preview/setup mode when Supabase is not configured
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => ({
          data: { user: null, session: null },
          error: { message: '⚠️ Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local' }
        }),
        signUp: async () => ({
          data: { user: null, session: null },
          error: { message: '⚠️ Supabase not configured. Please set your Supabase credentials in .env.local' }
        }),
        signInWithOAuth: async () => ({ data: { provider: 'google', url: null }, error: null }),
        signOut: async () => ({ error: null }),
      },
    } as unknown as ReturnType<typeof createBrowserClient>
  }

  if (!_client) {
    _client = createBrowserClient(SUPABASE_URL, SUPABASE_KEY)
  }
  return _client
}
