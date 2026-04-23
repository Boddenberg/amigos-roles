import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anonKey) {
  // Em dev, ajuda o desenvolvedor saber o motivo de nada carregar.
  console.warn(
    '[supabase] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não configuradas.',
  )
}

export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'anon', {
  auth: { persistSession: false, autoRefreshToken: false },
})

export const SUPABASE_READY = Boolean(url && anonKey)
