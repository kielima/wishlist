/**
 * Estado persistido da decisão AHP (por aparelho, em localStorage) e a ponte
 * entre ele e a matemática pura de `ahp.ts`.
 *
 * Desde a substituição do Duelo, a decisão AHP entra com TODOS os itens
 * elegíveis de uma vez (desejados, dentro dos filtros ativos) — não há mais
 * seleção de 2–8 itens. Para cada critério, os itens são avaliados de um de
 * dois modos:
 *  - `pares`: comparação par-a-par clássica (escala 1–9), n·(n−1)/2 pares;
 *  - `notas`: nota 1–9 por item (modo de classificação do AHP). A nota vira a
 *    matriz consistente a_ij = nota_i / nota_j, então a síntese é a mesma.
 * Sem escolha explícita, o modo segue o número de itens (`AUTO_PAIRS_MAX`).
 */
import { allPairs, computeAhp, pairKey, type AhpResult, type Judgments } from './ahp'

export const STORAGE_KEY = 'wishlist.ahp.v1'
export const MAX_CRITERIA = 8
export const DEFAULT_CRITERIA = ['Preço', 'Utilidade', 'Desejo']
/** Até este número de itens o modo automático usa pares (6 itens = 15 pares por critério). */
export const AUTO_PAIRS_MAX = 6
/** Nota de um item ainda não avaliado (meio da escala 1–9). */
export const DEFAULT_RATING = 5

export type ItemMode = 'pares' | 'notas'

export interface AhpSaved {
  criteria: string[]
  /** Julgamentos entre critérios, chave `"i|j"` por posição. */
  criteriaJudgments: Judgments
  /** Por critério (posição): chave `"idA|idB"` com idA < idB → quanto A é preferível a B. */
  itemJudgments: Array<Record<string, number>>
  /** Por critério (posição): id do item → nota 1–9. */
  itemRatings: Array<Record<string, number>>
  /** Modo escolhido; ausente = automático pelo número de itens. */
  itemMode?: ItemMode
  /** Id da última sugestão de pesos já aplicada ou ignorada neste aparelho (ver ahpSuggestion.ts). */
  suggestionHandled?: string
}

export function emptySaved(): AhpSaved {
  return { criteria: DEFAULT_CRITERIA, criteriaJudgments: {}, itemJudgments: [], itemRatings: [] }
}

export function loadAhp(): AhpSaved {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const s = JSON.parse(raw) as Partial<AhpSaved>
      if (Array.isArray(s.criteria) && s.criteria.length >= 2) {
        return {
          criteria: s.criteria,
          criteriaJudgments: s.criteriaJudgments ?? {},
          itemJudgments: s.itemJudgments ?? [],
          itemRatings: s.itemRatings ?? [],
          itemMode: s.itemMode === 'pares' || s.itemMode === 'notas' ? s.itemMode : undefined,
          suggestionHandled: typeof s.suggestionHandled === 'string' ? s.suggestionHandled : undefined,
        }
      }
    }
  } catch {
    /* storage indisponível ou corrompido: começa do zero */
  }
  return emptySaved()
}

export function saveAhp(s: AhpSaved): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    /* sem persistência: segue só em memória */
  }
}

export const idKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)

export function effectiveMode(s: AhpSaved, itemCount: number): ItemMode {
  return s.itemMode ?? (itemCount <= AUTO_PAIRS_MAX ? 'pares' : 'notas')
}

export function ratingOf(s: AhpSaved, c: number, id: string): number {
  const v = s.itemRatings[c]?.[id]
  return v !== undefined && Number.isFinite(v) ? Math.min(9, Math.max(1, Math.round(v))) : DEFAULT_RATING
}

/** Julgamentos posicionais (na ordem de `ids`) dos itens no critério `c`, no modo dado. */
export function itemJudgmentsFor(s: AhpSaved, c: number, ids: string[], mode: ItemMode): Judgments {
  const out: Judgments = {}
  if (mode === 'notas') {
    const r = ids.map((id) => ratingOf(s, c, id))
    for (const [i, j] of allPairs(ids.length)) out[pairKey(i, j)] = r[i]! / r[j]!
    return out
  }
  const store = s.itemJudgments[c] ?? {}
  for (const [i, j] of allPairs(ids.length)) {
    const a = ids[i]!
    const b = ids[j]!
    const v = store[idKey(a, b)]
    if (v !== undefined) out[pairKey(i, j)] = a < b ? v : 1 / v
  }
  return out
}

/** Síntese AHP sobre todos os `ids`, na ordem dada. */
export function computeFor(s: AhpSaved, ids: string[], mode: ItemMode = effectiveMode(s, ids.length)): AhpResult {
  return computeAhp({
    criteriaCount: s.criteria.length,
    criteriaJudgments: s.criteriaJudgments,
    itemCount: ids.length,
    itemJudgments: s.criteria.map((_, c) => itemJudgmentsFor(s, c, ids, mode)),
  })
}

/** Pontuação AHP global por id (soma 1 entre os `ids`). Usada pela ordenação "Ranking AHP". */
export function scoresById(s: AhpSaved, ids: string[]): Map<string, number> {
  const out = new Map<string, number>()
  if (ids.length === 0) return out
  const { scores } = computeFor(s, ids)
  ids.forEach((id, i) => out.set(id, scores[i]!))
  return out
}
