import { createBrowserClient } from '@supabase/ssr'

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || ''
export const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim() || ''

export function createSupabaseBrowserClient() {
  if (typeof window === 'undefined') return null
  if (!supabaseUrl || !supabaseKey) return null

  return createBrowserClient(supabaseUrl, supabaseKey)
}
