import { supabase } from './supabase'
import type { DuelRepository, RatingMap } from './duelRepository'

/** Linha da tabela `item_ratings` no Postgres (snake_case). */
interface Row {
  item_id: string
  r: number
  rd: number
  sigma: number
  updated_at: string
}

function client() {
  if (!supabase) throw new Error('Supabase não configurado')
  return supabase
}

/**
 * Implementação Supabase: ratings sincronizados entre aparelhos. RLS no
 * banco garante que cada usuário só vê os próprios ratings — por isso as
 * queries aqui não filtram por user_id manualmente.
 */
export class SupabaseDuelRepository implements DuelRepository {
  async listRatings(): Promise<RatingMap> {
    const { data, error } = await client().from('item_ratings').select('*')
    if (error) throw error
    const out: RatingMap = {}
    for (const row of data as Row[]) out[row.item_id] = { r: row.r, rd: row.rd, sigma: row.sigma }
    return out
  }

  async saveRatings(ratings: RatingMap): Promise<void> {
    const rows = Object.entries(ratings).map(([itemId, rating]) => ({
      // user_id é preenchido pelo default `auth.uid()` no banco.
      item_id: itemId,
      r: rating.r,
      rd: rating.rd,
      sigma: rating.sigma,
      updated_at: new Date().toISOString(),
    }))
    if (rows.length === 0) return
    const { error } = await client().from('item_ratings').upsert(rows)
    if (error) throw error
  }
}
