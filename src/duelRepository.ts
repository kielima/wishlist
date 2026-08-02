import { db } from './db'
import { isSupabaseConfigured } from './supabase'
import { SupabaseDuelRepository } from './duelRepositorySupabase'
import { DEFAULT_RATING, type GlickoRating } from './lib/glicko2'

/** Linha persistida (Dexie local ou, achatada, Supabase) de um rating. */
export interface DuelRatingRow {
  itemId: string
  r: number
  rd: number
  sigma: number
  updatedAt: string
}

export type RatingMap = Record<string, GlickoRating>

/**
 * Contrato de armazenamento do ranking por duelos. Espelha o
 * `WishlistRepository`: a UI nunca fala direto com Dexie/Supabase.
 */
export interface DuelRepository {
  /** Ratings de todos os itens que já duelaram ao menos uma vez. */
  listRatings(): Promise<RatingMap>
  /** Grava (upsert) os ratings alterados ao fim de uma sessão de duelos. */
  saveRatings(ratings: RatingMap): Promise<void>
}

function now(): string {
  return new Date().toISOString()
}

/** Implementação local-first, sobre IndexedDB — espelha `LocalRepository`. */
class LocalDuelRepository implements DuelRepository {
  async listRatings(): Promise<RatingMap> {
    const rows = await db.duelRatings.toArray()
    const out: RatingMap = {}
    for (const row of rows) out[row.itemId] = { r: row.r, rd: row.rd, sigma: row.sigma }
    return out
  }

  async saveRatings(ratings: RatingMap): Promise<void> {
    const ts = now()
    const rows: DuelRatingRow[] = Object.entries(ratings).map(([itemId, rating]) => ({
      itemId,
      r: rating.r,
      rd: rating.rd,
      sigma: rating.sigma,
      updatedAt: ts,
    }))
    await db.duelRatings.bulkPut(rows)
  }
}

/** Rating default para um item que ainda não duelou. */
export function ratingOrDefault(ratings: RatingMap, itemId: string): GlickoRating {
  return ratings[itemId] ?? DEFAULT_RATING
}

export const duelRepository: DuelRepository = isSupabaseConfigured ? new SupabaseDuelRepository() : new LocalDuelRepository()
