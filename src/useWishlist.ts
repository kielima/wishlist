import { useCallback, useEffect, useState } from 'react'
import { repository } from './repository'
import { db } from './db'
import { isSupabaseConfigured } from './supabase'
import type { WishItem, WishItemInput } from './types'

// Espelha a lista no IndexedDB só quando o repositório é o Supabase: no modo
// local (sem chaves configuradas) o repositório JÁ É essa mesma tabela, então
// mandar escrita pra lá seria redundante (e um clear() no meio de uma falha
// apagaria os dados reais do usuário).
async function cacheList(items: WishItem[]) {
  if (!isSupabaseConfigured) return
  await db.items.clear()
  await db.items.bulkPut(items)
}

async function cachePut(item: WishItem) {
  if (!isSupabaseConfigured) return
  await db.items.put(item)
}

async function cacheDelete(id: string) {
  if (!isSupabaseConfigured) return
  await db.items.delete(id)
}

/**
 * Estado da wishlist sincronizado com o repositório (Supabase ou IndexedDB).
 * Toda a UI usa este hook — nunca o repositório direto.
 */
export function useWishlist() {
  const [items, setItems] = useState<WishItem[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const fresh = await repository.list()
    setItems(fresh)
    void cacheList(fresh)
  }, [])

  useEffect(() => {
    let cancelled = false
    // Abre a tela com o que já está salvo do último sync (carregamento
    // instantâneo, inclusive offline) enquanto a busca real no Supabase roda
    // por baixo; quando ela termina, `refresh` substitui o estado em silêncio.
    async function start() {
      if (isSupabaseConfigured) {
        try {
          const cached = await db.items.toArray()
          if (!cancelled && cached.length > 0) {
            setItems(cached)
            setLoading(false)
          }
        } catch {
          // IndexedDB indisponível (modo privado, quota, etc.) — segue sem cache.
        }
      }
      try {
        await refresh()
      } finally {
        // Mesmo se a busca falhar: com `loading` preso em true, o
        // compartilhamento (que espera a lista carregar) nunca abriria.
        if (!cancelled) setLoading(false)
      }
    }
    start()
    return () => {
      cancelled = true
    }
  }, [refresh])

  // create/update/remove aplicam o resultado direto no estado local em vez de
  // re-buscar a lista inteira a cada gravação — cada item carrega a foto em
  // base64, então um refresh completo (dezenas de itens) deixava até uma
  // edição pequena visivelmente lenta para economizar uma única chamada.
  const create = useCallback(async (input: WishItemInput) => {
    const item = await repository.create(input)
    setItems((prev) => [item, ...prev])
    void cachePut(item)
    return item
  }, [])

  const update = useCallback(async (id: string, patch: Partial<WishItemInput>) => {
    const item = await repository.update(id, patch)
    setItems((prev) => [item, ...prev.filter((i) => i.id !== id)])
    void cachePut(item)
    return item
  }, [])

  const remove = useCallback(async (id: string) => {
    await repository.remove(id)
    setItems((prev) => prev.filter((i) => i.id !== id))
    void cacheDelete(id)
  }, [])

  return { items, loading, create, update, remove }
}
