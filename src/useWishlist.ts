import { useCallback, useEffect, useState } from 'react'
import { repository } from './repository'
import type { WishItem, WishItemInput } from './types'

/**
 * Estado da wishlist sincronizado com o repositório (IndexedDB).
 * Toda a UI usa este hook — nunca o repositório direto — então quando o
 * repositório virar Supabase (Fase 2), só este arquivo muda.
 */
export function useWishlist() {
  const [items, setItems] = useState<WishItem[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setItems(await repository.list())
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const create = useCallback(
    async (input: WishItemInput) => {
      const item = await repository.create(input)
      await refresh()
      return item
    },
    [refresh],
  )

  const update = useCallback(
    async (id: string, patch: Partial<WishItemInput>) => {
      const item = await repository.update(id, patch)
      await refresh()
      return item
    },
    [refresh],
  )

  const remove = useCallback(
    async (id: string) => {
      await repository.remove(id)
      await refresh()
    },
    [refresh],
  )

  return { items, loading, create, update, remove }
}
