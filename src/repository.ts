import { db } from './db'
import { isSupabaseConfigured } from './supabase'
import { SupabaseRepository } from './repositorySupabase'
import type { WishItem, WishItemInput } from './types'

/**
 * Contrato de armazenamento. TODA a UI conversa com a wishlist por aqui —
 * nunca direto com o Dexie/Supabase. Trocar a implementação (Fase 2: Supabase)
 * não toca em nenhum componente.
 */
export interface WishlistRepository {
  list(): Promise<WishItem[]>
  get(id: string): Promise<WishItem | undefined>
  create(input: WishItemInput): Promise<WishItem>
  update(id: string, patch: Partial<WishItemInput>): Promise<WishItem>
  remove(id: string): Promise<void>
}

function now(): string {
  return new Date().toISOString()
}

function newId(): string {
  // crypto.randomUUID é compatível com a sync futura (IDs estáveis e únicos).
  return crypto.randomUUID()
}

/** Implementação local-first (Fase 1), sobre IndexedDB. */
class LocalRepository implements WishlistRepository {
  async list(): Promise<WishItem[]> {
    return db.items.toArray()
  }

  async get(id: string): Promise<WishItem | undefined> {
    return db.items.get(id)
  }

  async create(input: WishItemInput): Promise<WishItem> {
    const ts = now()
    const item: WishItem = { ...input, id: newId(), createdAt: ts, updatedAt: ts }
    await db.items.add(item)
    return item
  }

  async update(id: string, patch: Partial<WishItemInput>): Promise<WishItem> {
    const current = await db.items.get(id)
    if (!current) throw new Error(`Item não encontrado: ${id}`)
    const updated: WishItem = { ...current, ...patch, updatedAt: now() }
    await db.items.put(updated)
    return updated
  }

  async remove(id: string): Promise<void> {
    await db.items.delete(id)
  }
}

/**
 * Instância única usada pela aplicação.
 * Com chaves do Supabase → sincroniza entre aparelhos (Fase 2).
 * Sem chaves → modo local em IndexedDB (Fase 1 / desenvolvimento).
 */
export const repository: WishlistRepository = isSupabaseConfigured
  ? new SupabaseRepository()
  : new LocalRepository()
