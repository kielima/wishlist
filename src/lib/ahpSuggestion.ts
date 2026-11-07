/**
 * Sugestão de pesos AHP vinda de fora do app (ex.: gerada por um agente a
 * partir dos objetivos de carreira de Kiê) — parte pura, sem React nem rede.
 *
 * A sugestão diz só "critério → peso + justificativa curta". Aplicá-la
 * converte os pesos numa matriz par-a-par consistente (a_ij = w_i / w_j,
 * restrita à escala de Saaty [1/9, 9]) e grava como julgamentos dos
 * critérios — o mesmo formato que os sliders produzem, então o ranking e a
 * ordenação "Ranking AHP" seguem a mesma síntese de `ahp.ts`.
 *
 * Nada aqui é aplicado sozinho: a UI só chama `applySuggestion` quando Kiê
 * aperta "Aplicar sugestão" (ver AhpModal).
 */
import { allPairs, clampJudgment, pairKey, type Judgments } from './ahp'
import { MAX_CRITERIA, type AhpSaved } from './ahpStore'

export interface SuggestedCriterion {
  /** Nome do critério como aparece no AHP (comparado sem acento/caixa). */
  name: string
  /** Peso relativo (> 0). Não precisa somar 1 — é normalizado. */
  weight: number
  /** Uma linha explicando o peso. */
  justification: string
}

export interface AhpSuggestion {
  id: string
  criteria: SuggestedCriterion[]
  /** De onde veio, ex.: "objetivos de carreira". */
  source: string
  /** ISO 8601. */
  generatedAt: string
}

/** Normaliza nome de critério para comparação: sem acento, sem caixa, espaços colapsados. */
export function normalizeName(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Valida e limpa uma sugestão vinda do banco. Descarta critérios sem nome,
 * com peso não positivo ou duplicados; devolve null se sobrarem menos de 2.
 */
export function parseSuggestion(raw: unknown): AhpSuggestion | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'string' || !Array.isArray(r.criteria)) return null
  const seen = new Set<string>()
  const criteria: SuggestedCriterion[] = []
  for (const c of r.criteria as unknown[]) {
    if (!c || typeof c !== 'object') continue
    const { name, weight, justification } = c as Record<string, unknown>
    if (typeof name !== 'string' || !name.trim()) continue
    const w = typeof weight === 'number' ? weight : Number(weight)
    if (!Number.isFinite(w) || w <= 0) continue
    const key = normalizeName(name)
    if (seen.has(key)) continue
    seen.add(key)
    criteria.push({ name: name.trim().slice(0, 30), weight: w, justification: typeof justification === 'string' ? justification.trim().slice(0, 200) : '' })
  }
  if (criteria.length < 2) return null
  const total = criteria.reduce((s, c) => s + c.weight, 0)
  return {
    id: r.id,
    criteria: criteria.map((c) => ({ ...c, weight: c.weight / total })),
    source: typeof r.source === 'string' ? r.source : '',
    generatedAt: typeof r.generated_at === 'string' ? r.generated_at : typeof r.generatedAt === 'string' ? r.generatedAt : '',
  }
}

/**
 * Pesos → julgamentos par-a-par posicionais: a_ij = w_i / w_j, restrito a
 * [1/9, 9]. Sem restrição a matriz é perfeitamente consistente (CR = 0) e o
 * autovetor devolve exatamente os pesos; com razão > 9 o extremo é cortado
 * e a consistência piora um pouco (ainda bem abaixo de 0,1 na prática).
 */
export function weightsToJudgments(weights: number[]): Judgments {
  const out: Judgments = {}
  for (const [i, j] of allPairs(weights.length)) {
    const a = weights[i]!
    const b = weights[j]!
    out[pairKey(i, j)] = a > 0 && b > 0 ? clampJudgment(a / b) : 1
  }
  return out
}

export interface ApplyPlan {
  /** Lista final de critérios (existentes + sugeridos que faltavam). */
  criteria: string[]
  /** Peso alvo por posição de `criteria` (soma 1). */
  weights: number[]
  /** Critérios sugeridos que entram como novos. */
  added: string[]
  /** Critérios já existentes que a sugestão não cobre (recebem peso mediano). */
  uncovered: string[]
  /** Critérios sugeridos que não couberam (limite MAX_CRITERIA). */
  skipped: string[]
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2
}

/**
 * Planeja a aplicação sem tocar no estado: casa critérios por nome
 * normalizado, acrescenta os sugeridos que faltam (até MAX_CRITERIA) e dá aos
 * existentes não cobertos o peso mediano da sugestão — explícito na UI para
 * Kiê ajustar no passo "Peso dos critérios".
 */
export function planSuggestion(current: string[], s: AhpSuggestion): ApplyPlan {
  const byName = new Map(s.criteria.map((c) => [normalizeName(c.name), c]))
  const currentKeys = new Set(current.map(normalizeName))
  const criteria = [...current]
  const added: string[] = []
  const skipped: string[] = []
  for (const c of s.criteria) {
    if (currentKeys.has(normalizeName(c.name))) continue
    if (criteria.length < MAX_CRITERIA) {
      criteria.push(c.name)
      added.push(c.name)
    } else skipped.push(c.name)
  }
  const fallback = median(s.criteria.map((c) => c.weight))
  const uncovered = current.filter((name) => !byName.has(normalizeName(name)))
  const raw = criteria.map((name) => byName.get(normalizeName(name))?.weight ?? fallback)
  const total = raw.reduce((a, b) => a + b, 0)
  return { criteria, weights: raw.map((w) => w / total), added, uncovered, skipped }
}

/**
 * Aplica a sugestão: substitui os julgamentos entre critérios pelos derivados
 * dos pesos e acrescenta critérios novos (com avaliações de itens vazias).
 * Avaliações de itens dos critérios existentes são preservadas.
 */
export function applySuggestion(saved: AhpSaved, s: AhpSuggestion): AhpSaved {
  const plan = planSuggestion(saved.criteria, s)
  const n = plan.criteria.length
  return {
    ...saved,
    criteria: plan.criteria,
    criteriaJudgments: weightsToJudgments(plan.weights),
    itemJudgments: Array.from({ length: n }, (_, k) => saved.itemJudgments[k] ?? {}),
    itemRatings: Array.from({ length: n }, (_, k) => saved.itemRatings[k] ?? {}),
    suggestionHandled: s.id,
  }
}
