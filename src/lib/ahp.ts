/**
 * AHP (Analytic Hierarchy Process, Saaty) — implementação pura, sem React.
 *
 * Fluxo: critérios com pesos obtidos por comparação par-a-par (escala 1–9),
 * itens comparados entre si em cada critério e ranking final como soma
 * ponderada das prioridades locais. Em toda matriz o vetor de prioridades é o
 * autovetor principal (iteração de potência) e a consistência é medida pela
 * razão CR = CI / RI; CR < 0,1 é considerado aceitável.
 *
 * Convenção de julgamento: `a_ij` = quantas vezes `i` é mais importante/
 * preferível que `j`, em [1/9, 9]. a_ji = 1 / a_ij, a_ii = 1.
 */

/** Limite de CR aceito por Saaty. */
export const CR_LIMIT = 0.1

/** Índice aleatório (RI) de Saaty para n = 1..15. */
const RANDOM_INDEX = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49, 1.51, 1.48, 1.56, 1.57, 1.59]

export type Matrix = number[][]

/** Julgamentos por par: chave `"i|j"` (i < j) → a_ij. Par ausente = igual (1). */
export type Judgments = Record<string, number>

export interface PairwiseResult {
  /** Vetor de prioridades (soma 1). */
  weights: number[]
  /** λmax estimado. */
  lambdaMax: number
  /** Índice de consistência (λmax − n) / (n − 1). */
  ci: number
  /** Razão de consistência CI / RI. 0 para n ≤ 2. */
  cr: number
  /** CR dentro do limite (< 0,1). */
  consistent: boolean
}

/** Chave estável de um par ordenado por índice. */
export function pairKey(i: number, j: number): string {
  return i < j ? `${i}|${j}` : `${j}|${i}`
}

/** Restringe um julgamento à escala de Saaty contínua [1/9, 9]. */
export function clampJudgment(v: number): number {
  if (!Number.isFinite(v) || v <= 0) return 1
  return Math.min(9, Math.max(1 / 9, v))
}

/**
 * Converte posição de slider inteira (−8..8) em julgamento a_ij:
 * 0 → 1 (igual); k > 0 → k+1 (i preferido); k < 0 → 1/(|k|+1) (j preferido).
 */
export function stepToJudgment(step: number): number {
  const s = Math.max(-8, Math.min(8, Math.round(step)))
  return s >= 0 ? s + 1 : 1 / (1 - s)
}

/** Inverso de `stepToJudgment` (arredonda ao degrau mais próximo da escala 1–9). */
export function judgmentToStep(v: number): number {
  const a = clampJudgment(v)
  return a >= 1 ? Math.round(a) - 1 : -(Math.round(1 / a) - 1)
}

/** Lê o julgamento a_ij de um conjunto de julgamentos (par ausente = 1). */
export function judgmentOf(judgments: Judgments, i: number, j: number): number {
  if (i === j) return 1
  const v = judgments[pairKey(i, j)]
  if (v === undefined) return 1
  return i < j ? clampJudgment(v) : 1 / clampJudgment(v)
}

/** Monta a matriz recíproca n×n a partir dos julgamentos. */
export function buildMatrix(n: number, judgments: Judgments): Matrix {
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => judgmentOf(judgments, i, j)))
}

/** Número de comparações necessárias para n elementos. */
export function pairCount(n: number): number {
  return n < 2 ? 0 : (n * (n - 1)) / 2
}

/** Todos os pares (i < j) de n elementos, em ordem estável. */
export function allPairs(n: number): Array<[number, number]> {
  const out: Array<[number, number]> = []
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) out.push([i, j])
  return out
}

/**
 * Prioridades e consistência de uma matriz de comparação par-a-par.
 * Autovetor principal por iteração de potência (converge para matrizes
 * positivas); λmax = média de (A·w)_i / w_i.
 */
export function analyzeMatrix(m: Matrix): PairwiseResult {
  const n = m.length
  if (n === 0) return { weights: [], lambdaMax: 0, ci: 0, cr: 0, consistent: true }
  if (n === 1) return { weights: [1], lambdaMax: 1, ci: 0, cr: 0, consistent: true }

  let w: number[] = new Array(n).fill(1 / n)
  for (let iter = 0; iter < 1000; iter++) {
    const next = m.map((row) => row.reduce((s, a, j) => s + a * w[j]!, 0))
    const total = next.reduce((s, v) => s + v, 0)
    const normalized = next.map((v) => v / total)
    const delta = normalized.reduce((mx, v, i) => Math.max(mx, Math.abs(v - w[i]!)), 0)
    w = normalized
    if (delta < 1e-12) break
  }

  const aw = m.map((row) => row.reduce((s, a, j) => s + a * w[j]!, 0))
  const lambdaMax = aw.reduce((s, v, i) => s + v / w[i]!, 0) / n
  const ci = n > 2 ? Math.max(0, (lambdaMax - n) / (n - 1)) : 0
  const ri = n <= RANDOM_INDEX.length ? RANDOM_INDEX[n - 1]! : RANDOM_INDEX[RANDOM_INDEX.length - 1]!
  const cr = ri > 0 ? ci / ri : 0
  return { weights: w, lambdaMax, ci, cr, consistent: cr < CR_LIMIT }
}

/** Atalho: analisa direto a partir dos julgamentos. */
export function analyzeJudgments(n: number, judgments: Judgments): PairwiseResult {
  return analyzeMatrix(buildMatrix(n, judgments))
}

/**
 * Aponta o par cujo julgamento mais destoa do que as prioridades implicam
 * (maior |ln(a_ij · w_j / w_i)|) — o melhor candidato a revisar quando CR ≥ 0,1.
 */
export function mostInconsistentPair(n: number, judgments: Judgments): { pair: [number, number]; suggested: number } | null {
  if (n < 3) return null
  const { weights } = analyzeJudgments(n, judgments)
  let best: { pair: [number, number]; err: number; suggested: number } | null = null
  for (const [i, j] of allPairs(n)) {
    const implied = weights[i]! / weights[j]!
    const err = Math.abs(Math.log(judgmentOf(judgments, i, j) / implied))
    if (!best || err > best.err) best = { pair: [i, j], err, suggested: clampJudgment(implied) }
  }
  return best && { pair: best.pair, suggested: best.suggested }
}

export interface AhpInput {
  criteriaCount: number
  criteriaJudgments: Judgments
  itemCount: number
  /** Um conjunto de julgamentos de itens por critério (índice = critério). */
  itemJudgments: Judgments[]
}

export interface AhpResult {
  criteria: PairwiseResult
  /** Análise dos itens em cada critério. */
  perCriterion: PairwiseResult[]
  /** Pontuação global por item (soma 1), na ordem dos itens. */
  scores: number[]
  /** Índices dos itens do melhor ao pior (empate: ordem original). */
  ranking: number[]
  /** Todas as matrizes (critérios e cada critério) com CR < 0,1. */
  consistent: boolean
}

/** Síntese AHP: pontuação global = Σ_c peso(c) · prioridade_local(item, c). */
export function computeAhp(input: AhpInput): AhpResult {
  const criteria = analyzeJudgments(input.criteriaCount, input.criteriaJudgments)
  const perCriterion = Array.from({ length: input.criteriaCount }, (_, c) => analyzeJudgments(input.itemCount, input.itemJudgments[c] ?? {}))
  const scores = Array.from({ length: input.itemCount }, (_, i) =>
    perCriterion.reduce((s, r, c) => s + criteria.weights[c]! * r.weights[i]!, 0),
  )
  const ranking = scores.map((_, i) => i).sort((a, b) => scores[b]! - scores[a]! || a - b)
  return { criteria, perCriterion, scores, ranking, consistent: criteria.consistent && perCriterion.every((r) => r.consistent) }
}
