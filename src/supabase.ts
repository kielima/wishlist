import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True quando as chaves do Supabase estão configuradas (Fase 2 ativa). */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * Cliente Supabase. É null quando não há chaves — nesse caso o app cai no
 * modo local (IndexedDB), útil para desenvolvimento sem backend.
 */
export const supabase = isSupabaseConfigured ? createClient(url!, anonKey!) : null
