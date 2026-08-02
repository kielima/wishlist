import { useCallback, useEffect, useState } from 'react'
import { duelRepository, type RatingMap } from './duelRepository'
import { applySessionDuels, type DuelResult } from './lib/duelPairing'

/**
 * Estado do ranking por duelos, sincronizado com o `duelRepository`.
 * Espelha `useWishlist`: a UI nunca fala com o repositório direto.
 */
export function useDuelRatings() {
  const [ratings, setRatings] = useState<RatingMap>({})
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setRatings(await duelRepository.listRatings())
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  /**
   * Aplica uma sessão inteira de duelos (ver `applySessionDuels`) e persiste
   * só os ratings que mudaram, num único upsert.
   */
  const applySession = useCallback(
    async (duels: DuelResult[]) => {
      if (duels.length === 0) return ratings
      const changed = applySessionDuels(ratings, duels)
      await duelRepository.saveRatings(changed)
      const next = { ...ratings, ...changed }
      setRatings(next)
      return next
    },
    [ratings],
  )

  return { ratings, loading, refresh, applySession }
}
