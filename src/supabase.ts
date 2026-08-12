import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True quando as chaves do Supabase estão configuradas (Fase 2 ativa). */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * Cliente Supabase. É null quando não há chaves — nesse caso o app cai no
 * modo local (IndexedDB), útil para desenvolvimento sem backend.
 *
 * O projeto é compartilhado com o app-produtividade (consolidação dos dois
 * projetos num só), então as tabelas da wishlist vivem no schema `wishlist`
 * em vez do `public` — ver supabase/migrations/0005. Definir o schema aqui
 * faz todo `.from('items')` / `.from('item_ratings')` / `.from('app_version')`
 * resolver para `wishlist.*` sem mudar os repositórios.
 *
 * Storage e Auth não são afetados: usam endpoints próprios, fora do PostgREST.
 */
export const supabase = isSupabaseConfigured
  ? createClient(url!, anonKey!, { db: { schema: 'wishlist' } })
  : null
