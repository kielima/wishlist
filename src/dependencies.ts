import type { WishItem } from './types'

/** Pré-requisitos de `item` que ainda não foram comprados. */
export function blockingItems(item: WishItem, allItems: WishItem[]): WishItem[] {
  const depIds = item.dependsOn ?? []
  if (!depIds.length) return []
  const byId = new Map(allItems.map((i) => [i.id, i]))
  return depIds
    .map((id) => byId.get(id))
    .filter((dep): dep is WishItem => !!dep && dep.status !== 'bought')
}

export function isBlocked(item: WishItem, allItems: WishItem[]): boolean {
  return blockingItems(item, allItems).length > 0
}

/**
 * Verifica se fazer `itemId` depender de cada id em `candidateDeps` fecharia um
 * ciclo (ex: A depende de B, que já depende de A, direta ou indiretamente).
 */
export function wouldCreateCycle(itemId: string, candidateDeps: string[], allItems: WishItem[]): boolean {
  const byId = new Map(allItems.map((i) => [i.id, i]))
  const visited = new Set<string>()

  function reaches(fromId: string, targetId: string): boolean {
    if (fromId === targetId) return true
    if (visited.has(fromId)) return false
    visited.add(fromId)
    const deps = byId.get(fromId)?.dependsOn ?? []
    return deps.some((d) => reaches(d, targetId))
  }

  return candidateDeps.some((depId) => reaches(depId, itemId))
}
