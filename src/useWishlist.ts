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

  // create/update/remove aplicam o resultado direto no estado local em vez de
  // re-buscar a lista inteira a cada gravação — cada item carrega a foto em
  // base64, então um refresh completo (dezenas de itens) deixava até uma
  // edição pequena visivelmente lenta para economizar uma única chamada.
  const create = useCallback(async (input: WishItemInput) => {
    const item = await repository.create(input)
    setItems((prev) => [item, ...prev])
    return item
  }, [])

  const update = useCallback(async (id: string, patch: Partial<WishItemInput>) => {
    const item = await repository.update(id, patch)
    setItems((prev) => [item, ...prev.filter((i) => i.id !== id)])
    return item
  }, [])

  const remove = useCallback(async (id: string) => {
    await repository.remove(id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  return { items, loading, create, update, remove }
}
