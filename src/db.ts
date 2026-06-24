import Dexie, { type Table } from 'dexie'
import type { WishItem } from './types'

/**
 * Banco local em IndexedDB (via Dexie). É a fonte de verdade na Fase 1.
 * Na Fase 2 ele passa a ser o cache offline que espelha o Supabase.
 */
class WishlistDB extends Dexie {
  items!: Table<WishItem, string>

  constructor() {
    super('wishlist')
    this.version(1).stores({
      // Índices para filtros/ordenação. `*categories` é multi-entrada (array).
      items: 'id, status, priority, updatedAt, *categories',
    })
  }
}

export const db = new WishlistDB()
