/**
 * Notas sugeridas por item num critério do AHP (ex.: "Alinhamento com a
 * carreira", gerado por um agente a partir dos objetivos de carreira de Kiê).
 * Parte pura, sem React nem rede. Tabela `wishlist.ahp_item_score_suggestions`
 * (migration 0008).
 *
 * Escala: a mesma do modo "notas" do AHP, inteiro de 1 (pior) a 9 (melhor).
 *
 * Aplicar só preenche o que ainda não foi avaliado naquele critério; as
 * avaliações existentes só mudam se Kiê marcar "substituir as que já avaliei".
 * Nada aqui é aplicado sozinho: a UI só chama `applyItemScores` num clique.
 */
import { idKey, type AhpSaved, type ItemMode } from './ahpStore'
import { normalizeName } from './ahpSuggestion'

export interface ItemScoreSuggestion {
  itemId: string
  /** Nome do critério como gravado (comparado sem acento/caixa). */
  criterion: string
  /** Inteiro 1–9. */
  score: number
  justification: string
  /** ISO 8601. */
  generatedAt: string
}

const time = (iso: string) => {
  const t = Date.parse(iso)
  return Number.isNaN(t) ? -Infinity : t
}

/**
 * Valida linhas vindas do banco e fica só com a mais recente por
 * (item, critério normalizado). Descarta notas fora de 1–9 (arredonda as
 * fracionárias) e linhas sem item/critério.
 */
export function parseItemScoreRows(rows: unknown): ItemScoreSuggestion[] {
  if (!Array.isArray(rows)) return []
  const latest = new Map<string, ItemScoreSuggestion>()
  for (const raw of rows) {
    if (!raw || typeof raw !== 'object') continue
    const r = raw as Record<string, unknown>
    const itemId = r.item_id ?? r.itemId
    const criterion = r.criterion
    if (typeof itemId !== 'string' || !itemId || typeof criterion !== 'string' || !criterion.trim()) continue
    const n = typeof r.score === 'number' ? r.score : Number(r.score)
    if (!Number.isFinite(n)) continue
    const score = Math.round(n)
    if (score < 1 || score > 9) continue
    const generatedAt = typeof r.generated_at === 'string' ? r.generated_at : typeof r.generatedAt === 'string' ? r.generatedAt : ''
    const s: ItemScoreSuggestion = {
      itemId,
      criterion: criterion.trim().slice(0, 30),
      score,
      justification: typeof r.justification === 'string' ? r.justification.trim().slice(0, 200) : '',
      generatedAt,
    }
    const key = `${itemId}\u0000${normalizeName(s.criterion)}`
    const prev = latest.get(key)
    if (!prev || time(generatedAt) > time(prev.generatedAt)) latest.set(key, s)
  }
  return [...latest.values()]
}

export interface CriterionScores {
  /** id do item → sugestão, só itens que estão na decisão. */
  byItem: Map<string, ItemScoreSuggestion>
  /** `generated_at` mais recente entre essas sugestões (marca de "já vista"). */
  latest: string
}

/** Sugestões do critério `criterion` (sem acento/caixa) para os itens em `ids`; null se não houver nenhuma. */
export function scoresForCriterion(all: ItemScoreSuggestion[], criterion: string, ids: string[]): CriterionScores | null {
  const want = normalizeName(criterion)
  const inDecision = new Set(ids)
  const byItem = new Map<string, ItemScoreSuggestion>()
  let latest = ''
  for (const s of all) {
    if (!inDecision.has(s.itemId) || normalizeName(s.criterion) !== want) continue
    byItem.set(s.itemId, s)
    if (!latest || time(s.generatedAt) > time(latest)) latest = s.generatedAt
  }
  return byItem.size > 0 ? { byItem, latest } : null
}

/** Marca de "já aplicada ou ignorada" para o critério, comparando com a sugestão mais recente. */
export function isItemScoreHandled(saved: AhpSaved, criterion: string, cs: CriterionScores): boolean {
  return saved.itemScoreHandled?.[normalizeName(criterion)] === cs.latest
}

export function markItemScoreHandled(saved: AhpSaved, criterion: string, cs: CriterionScores): AhpSaved {
  return { ...saved, itemScoreHandled: { ...saved.itemScoreHandled, [normalizeName(criterion)]: cs.latest } }
}

export interface ItemScorePlan {
  /** Unidade das contagens: no modo notas, itens; no modo pares, pares. */
  unit: 'itens' | 'pares'
  /** Sem avaliação ainda: entram em "Aplicar nas que faltam". */
  fill: number
  /** Já avaliados com valor diferente do sugerido: só mudam com "substituir". */
  replace: number
}

const PAIR_EPS = 1e-9

function suggestedPairs(ids: string[], cs: CriterionScores): Array<[string, number]> {
  const withScore = ids.filter((id) => cs.byItem.has(id))
  const out: Array<[string, number]> = []
  for (let i = 0; i < withScore.length; i++) {
    for (let j = i + 1; j < withScore.length; j++) {
      const a = withScore[i]!
      const b = withScore[j]!
      // Formato de itemJudgments: chave "idA|idB" com idA < idB → quanto A é preferível a B.
      const [lo, hi] = a < b ? [a, b] : [b, a]
      out.push([idKey(a, b), cs.byItem.get(lo)!.score / cs.byItem.get(hi)!.score])
    }
  }
  return out
}

/**
 * Conta o que mudaria no critério `c` sem tocar no estado. No modo notas, um
 * item sem nota gravada conta como "falta"; no modo pares, um par sem
 * julgamento gravado (entre dois itens com nota sugerida).
 */
export function planItemScores(saved: AhpSaved, c: number, ids: string[], mode: ItemMode, cs: CriterionScores): ItemScorePlan {
  let fill = 0
  let replace = 0
  if (mode === 'notas') {
    const ratings = saved.itemRatings[c] ?? {}
    for (const id of ids) {
      const s = cs.byItem.get(id)
      if (!s) continue
      const cur = ratings[id]
      if (cur === undefined || !Number.isFinite(cur)) fill++
      else if (Math.round(cur) !== s.score) replace++
    }
    return { unit: 'itens', fill, replace }
  }
  const store = saved.itemJudgments[c] ?? {}
  for (const [key, v] of suggestedPairs(ids, cs)) {
    const cur = store[key]
    if (cur === undefined || !Number.isFinite(cur)) fill++
    else if (Math.abs(cur - v) > PAIR_EPS) replace++
  }
  return { unit: 'pares', fill, replace }
}

/**
 * Aplica as notas sugeridas no critério `c`. Por padrão só preenche o que
 * falta; com `replace` também sobrescreve as avaliações existentes. No modo
 * pares, as notas viram julgamentos a_ij = nota_i / nota_j (sempre dentro de
 * [1/9, 9]). Marca o critério como "já visto". Outros critérios não mudam.
 */
export function applyItemScores(saved: AhpSaved, c: number, ids: string[], mode: ItemMode, cs: CriterionScores, opts: { replace?: boolean } = {}): AhpSaved {
  const n = saved.criteria.length
  const criterion = saved.criteria[c]
  if (criterion === undefined) return saved
  let next: AhpSaved
  if (mode === 'notas') {
    const list = Array.from({ length: n }, (_, k) => saved.itemRatings[k] ?? {})
    const cur = { ...list[c] }
    for (const id of ids) {
      const s = cs.byItem.get(id)
      if (!s) continue
      if (opts.replace || cur[id] === undefined || !Number.isFinite(cur[id])) cur[id] = s.score
    }
    list[c] = cur
    next = { ...saved, itemRatings: list }
  } else {
    const list = Array.from({ length: n }, (_, k) => saved.itemJudgments[k] ?? {})
    const cur = { ...list[c] }
    for (const [key, v] of suggestedPairs(ids, cs)) {
      if (opts.replace || cur[key] === undefined || !Number.isFinite(cur[key])) cur[key] = v
    }
    list[c] = cur
    next = { ...saved, itemJudgments: list }
  }
  return markItemScoreHandled(next, criterion, cs)
}
