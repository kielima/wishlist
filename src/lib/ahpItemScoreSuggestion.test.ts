import { describe, expect, it } from 'vitest'
import { computeFor, emptySaved, idKey, type AhpSaved } from './ahpStore'
import { applyItemScores, isItemScoreHandled, markItemScoreHandled, parseItemScoreRows, planItemScores, scoresForCriterion } from './ahpItemScoreSuggestion'

const CRIT = 'Alinhamento com a carreira'
const row = (item_id: string, score: unknown, generated_at = '2026-11-08T12:00:00Z', criterion = CRIT, justification: unknown = 'serve à frente principal') => ({ item_id, criterion, score, justification, generated_at })

const savedWith = (p: Partial<AhpSaved> = {}): AhpSaved => ({ ...emptySaved(), criteria: ['Preço', 'Utilidade', 'Desejo', CRIT], ...p })

describe('parseItemScoreRows', () => {
  it('fica com a mais recente por item e critério (sem acento/caixa)', () => {
    const out = parseItemScoreRows([
      row('a', 3, '2026-11-01T00:00:00Z'),
      row('a', 8, '2026-11-08T00:00:00Z', 'alinhamento com a CARREIRA'),
      row('b', '7'),
    ])
    expect(out).toHaveLength(2)
    expect(out.find((s) => s.itemId === 'a')!.score).toBe(8)
    expect(out.find((s) => s.itemId === 'b')!.score).toBe(7)
  })

  it('descarta notas fora de 1–9, linhas sem item/critério e formato errado', () => {
    expect(parseItemScoreRows(null)).toEqual([])
    const out = parseItemScoreRows([row('a', 0), row('b', 10), row('c', 'x'), row('', 5), { item_id: 'd', score: 5 }, row('e', 6.6, undefined, CRIT, null)])
    expect(out).toEqual([{ itemId: 'e', criterion: CRIT, score: 7, justification: '', generatedAt: '2026-11-08T12:00:00Z' }])
  })
})

describe('scoresForCriterion', () => {
  const all = parseItemScoreRows([row('a', 8, '2026-11-08T00:00:00Z'), row('b', 4, '2026-11-09T00:00:00Z'), row('fora', 9), row('a', 2, undefined, 'Preço')])

  it('casa o critério sem acento/caixa e só considera itens na decisão', () => {
    const cs = scoresForCriterion(all, 'ALINHAMENTO COM A CARREIRA', ['a', 'b', 'c'])!
    expect([...cs.byItem.keys()].sort()).toEqual(['a', 'b'])
    expect(cs.latest).toBe('2026-11-09T00:00:00Z')
    expect(scoresForCriterion(all, 'preco', ['a'])!.byItem.get('a')!.score).toBe(2)
  })

  it('devolve null sem sugestões para o critério', () => {
    expect(scoresForCriterion(all, 'Desejo', ['a', 'b'])).toBeNull()
    expect(scoresForCriterion([], CRIT, ['a'])).toBeNull()
  })
})

describe('planItemScores / applyItemScores (modo notas)', () => {
  const cs = scoresForCriterion(parseItemScoreRows([row('a', 8), row('b', 4), row('c', 6)]), CRIT, ['a', 'b', 'c', 'd'])!
  const ids = ['a', 'b', 'c', 'd']

  it('por padrão só preenche itens sem nota e não toca nos já avaliados', () => {
    const saved = savedWith({ itemRatings: [{ a: 1 }, {}, {}, { a: 2, c: 6 }] })
    expect(planItemScores(saved, 3, ids, 'notas', cs)).toEqual({ unit: 'itens', fill: 1, replace: 1 })
    const next = applyItemScores(saved, 3, ids, 'notas', cs)
    expect(next.itemRatings[3]).toEqual({ a: 2, b: 4, c: 6 })
    expect(next.itemRatings[0]).toEqual({ a: 1 }) // outro critério intacto
    expect(saved.itemRatings[3]).toEqual({ a: 2, c: 6 }) // não muta a entrada
  })

  it('substitui as existentes só com replace', () => {
    const saved = savedWith({ itemRatings: [{}, {}, {}, { a: 2 }] })
    const next = applyItemScores(saved, 3, ids, 'notas', cs, { replace: true })
    expect(next.itemRatings[3]).toEqual({ a: 8, b: 4, c: 6 })
    expect(planItemScores(next, 3, ids, 'notas', cs)).toEqual({ unit: 'itens', fill: 0, replace: 0 })
  })

  it('cria a lista de notas do critério quando ainda não existe e afeta o ranking', () => {
    const next = applyItemScores(savedWith(), 3, ['a', 'b'], 'notas', cs)
    expect(next.itemRatings).toHaveLength(4)
    expect(next.itemRatings[3]).toEqual({ a: 8, b: 4 })
    const r = computeFor({ ...next, itemMode: 'notas' }, ['a', 'b'])
    expect(r.perCriterion[3]!.weights[0]).toBeCloseTo(8 / 12)
  })

  it('marca o critério como visto com o generated_at mais recente', () => {
    const saved = savedWith()
    expect(isItemScoreHandled(saved, CRIT, cs)).toBe(false)
    expect(isItemScoreHandled(applyItemScores(saved, 3, ids, 'notas', cs), 'alinhamento com a carreira', cs)).toBe(true)
    const ignored = markItemScoreHandled(saved, CRIT, cs)
    expect(ignored.itemRatings).toBe(saved.itemRatings)
    expect(isItemScoreHandled(ignored, CRIT, cs)).toBe(true)
    // Sugestão nova (generated_at maior) volta a aparecer.
    const newer = scoresForCriterion(parseItemScoreRows([row('a', 5, '2026-12-01T00:00:00Z')]), CRIT, ids)!
    expect(isItemScoreHandled(ignored, CRIT, newer)).toBe(false)
  })
})

describe('planItemScores / applyItemScores (modo pares)', () => {
  const cs = scoresForCriterion(parseItemScoreRows([row('a', 8), row('b', 4), row('c', 2)]), CRIT, ['a', 'b', 'c'])!
  const ids = ['a', 'b', 'c']

  it('preenche só pares sem julgamento com a razão das notas', () => {
    const saved = savedWith({ itemJudgments: [{}, {}, {}, { [idKey('a', 'b')]: 1 }] })
    expect(planItemScores(saved, 3, ids, 'pares', cs)).toEqual({ unit: 'pares', fill: 2, replace: 1 })
    const next = applyItemScores(saved, 3, ids, 'pares', cs)
    expect(next.itemJudgments[3]).toEqual({ [idKey('a', 'b')]: 1, [idKey('a', 'c')]: 4, [idKey('b', 'c')]: 2 })
    const all = applyItemScores(saved, 3, ids, 'pares', cs, { replace: true })
    expect(all.itemJudgments[3]![idKey('a', 'b')]).toBe(2)
  })
})
