import { supabase } from './supabase'
import type { WishlistRepository } from './repository'
import type { Receipt, WishItem, WishItemInput } from './types'

/** Linha da tabela `items` no Postgres (snake_case). */
interface Row {
  id: string
  name: string
  description: string
  link: string
  price_cents: number | null
  priority: WishItem['priority']
  status: WishItem['status']
  categories: string[] | null
  photo: string | null
  receipt: Receipt | null
  created_at: string
  updated_at: string
}

function fromRow(r: Row): WishItem {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? '',
    link: r.link ?? '',
    priceCents: r.price_cents,
    priority: r.priority,
    status: r.status,
    categories: r.categories ?? [],
    photo: r.photo,
    receipt: r.receipt,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

/** Mapeia campos do app (camelCase) para colunas do banco (snake_case). */
function toRow(patch: Partial<WishItemInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (patch.name !== undefined) row.name = patch.name
  if (patch.description !== undefined) row.description = patch.description
  if (patch.link !== undefined) row.link = patch.link
  if (patch.priceCents !== undefined) row.price_cents = patch.priceCents
  if (patch.priority !== undefined) row.priority = patch.priority
  if (patch.status !== undefined) row.status = patch.status
  if (patch.categories !== undefined) row.categories = patch.categories
  if (patch.photo !== undefined) row.photo = patch.photo
  if (patch.receipt !== undefined) row.receipt = patch.receipt
  return row
}

function client() {
  if (!supabase) throw new Error('Supabase não configurado')
  return supabase
}

/**
 * Implementação da Fase 2: dados no Supabase, sincronizados entre aparelhos.
 * A segurança é garantida por RLS no banco (cada usuário só vê os próprios
 * itens) — por isso as queries aqui não filtram por user_id manualmente.
 */
export class SupabaseRepository implements WishlistRepository {
  async list(): Promise<WishItem[]> {
    const { data, error } = await client()
      .from('items')
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) throw error
    return (data as Row[]).map(fromRow)
  }

  async get(id: string): Promise<WishItem | undefined> {
    const { data, error } = await client().from('items').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data ? fromRow(data as Row) : undefined
  }

  async create(input: WishItemInput): Promise<WishItem> {
    // user_id é preenchido pelo default `auth.uid()` no banco.
    const { data, error } = await client().from('items').insert(toRow(input)).select('*').single()
    if (error) throw error
    return fromRow(data as Row)
  }

  async update(id: string, patch: Partial<WishItemInput>): Promise<WishItem> {
    const { data, error } = await client()
      .from('items')
      .update({ ...toRow(patch), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return fromRow(data as Row)
  }

  async remove(id: string): Promise<void> {
    const { error } = await client().from('items').delete().eq('id', id)
    if (error) throw error
  }
}
