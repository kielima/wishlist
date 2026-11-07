import { describe, expect, it } from 'vitest'
import { analyzeJudgments, computeAhp, CR_LIMIT, pairKey } from './ahp'
import { computeFor, emptySaved, type AhpSaved } from './ahpStore'
import { applySuggestion, normalizeName, parseSuggestion, planSuggestion, weightsToJudgments, type AhpSuggestion } from './ahpSuggestion'

const suggestion = (criteria: Array<[string, number]>, id = 's1'): AhpSuggestion =>
  parseSuggestion({ id, source: 'objetivos de carreira', generated_at: '2026-11-07T12:00:00Z', criteria: criteria.map(([name, weight]) => ({ name, weight, justification: 'x' })) })!

describe('weightsToJudgments', () => {
  it('gera matriz perfeitamente consistente que devolve os mesmos pesos', () => {
    const w = [0.5, 0.3, 0.2]
    const r = analyzeJudgments(3, weightsToJudgments(w))
    r.weights.forEach((v, i) => expect(v).toBeCloseTo(w[i]!, 9))
    expect(r.cr).toBeCloseTo(0, 9)
    expect(r.consistent).toBe(true)
  })

  it('restringe razões à escala de Saaty [1/9, 9] e continua consistente', () => {
    const j = weightsToJudgments([0.9, 0.05, 0.05])
    expect(j[pairKey(0, 1)]).toBe(9)
    expect(j[pairKey(0, 2)]).toBe(9)
    expect(j[pairKey(1, 2)]).toBe(1)
    const r = analyzeJudgments(3, j)
    expect(r.cr).toBeLessThan(CR_LIMIT)
    expect(r.weights[0]).toBeGreaterThan(r.weights[1]!)
  })

  it('peso inválido vira igualdade', () => {
    expect(weightsToJudgments([0, 1])[pairKey(0, 1)]).toBe(1)
  })
})

describe('parseSuggestion', () => {
  it('normaliza pesos e descarta entradas inválidas/duplicadas', () => {
    const s = parseSuggestion({
      id: 'a',
      criteria: [
        { name: 'Preço', weight: 2 },
        { name: 'preco', weight: 5 },
        { name: '', weight: 1 },
        { name: 'Utilidade', weight: -1 },
        { name: 'Desejo', weight: '2' },
      ],
    })!
    expect(s.criteria.map((c) => c.name)).toEqual(['Preço', 'Desejo'])
    expect(s.criteria.reduce((a, c) => a + c.weight, 0)).toBeCloseTo(1)
  })

  it('rejeita menos de 2 critérios ou formato errado', () => {
    expect(parseSuggestion(null)).toBeNull()
    expect(parseSuggestion({ id: 'a', criteria: [{ name: 'Preço', weight: 1 }] })).toBeNull()
    expect(parseSuggestion({ criteria: [] })).toBeNull()
  })
})

describe('planSuggestion / applySuggestion', () => {
  it('casa nomes sem acento/caixa, acrescenta faltantes e dá peso mediano aos não cobertos', () => {
    expect(normalizeName('  PREÇO ')).toBe('preco')
    const s = suggestion([['preco', 1], ['Utilidade', 3], ['Alinhamento com a carreira', 4]])
    const plan = planSuggestion(['Preço', 'Utilidade', 'Desejo'], s)
    expect(plan.criteria).toEqual(['Preço', 'Utilidade', 'Desejo', 'Alinhamento com a carreira'])
    expect(plan.added).toEqual(['Alinhamento com a carreira'])
    expect(plan.uncovered).toEqual(['Desejo'])
    expect(plan.weights[2]).toBeCloseTo(plan.weights[1]!) // mediana = Utilidade
    expect(plan.weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1)
  })

  it('aplica pesos como julgamentos, preserva avaliações de itens e marca a sugestão', () => {
    const saved: AhpSaved = { ...emptySaved(), criteriaJudgments: { '0|1': 9 }, itemRatings: [{ a: 9, b: 1 }, { a: 1, b: 9 }, {}] }
    const s = suggestion([['Preço', 1], ['Utilidade', 4], ['Desejo', 1]])
    const next = applySuggestion(saved, s)
    expect(next.suggestionHandled).toBe('s1')
    expect(next.itemRatings[0]).toEqual({ a: 9, b: 1 })
    const w = analyzeJudgments(3, next.criteriaJudgments).weights
    expect(w[1]).toBeCloseTo(4 / 6, 6)
    // Re-prioriza os itens pela síntese existente: "b" vence em Utilidade, que agora pesa mais.
    const ranking = computeFor({ ...next, itemMode: 'notas' }, ['a', 'b']).ranking
    expect(ranking[0]).toBe(1)
  })

  it('respeita o limite de critérios', () => {
    const many = Array.from({ length: 8 }, (_, i) => `C${i}`)
    const plan = planSuggestion(many, suggestion([['C0', 1], ['Novo', 1]]))
    expect(plan.criteria).toHaveLength(8)
    expect(plan.skipped).toEqual(['Novo'])
  })
})

describe('computeAhp (regressão)', () => {
  it('pesos de critérios consistentes ponderam as prioridades locais', () => {
    const r = computeAhp({ criteriaCount: 2, criteriaJudgments: weightsToJudgments([0.75, 0.25]), itemCount: 2, itemJudgments: [{ '0|1': 3 }, { '0|1': 1 / 3 }] })
    expect(r.scores[0]).toBeCloseTo(0.75 * 0.75 + 0.25 * 0.25)
    expect(r.ranking).toEqual([0, 1])
  })
})
