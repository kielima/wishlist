import { useMemo, useState } from 'react'
import { allPairs, analyzeJudgments, CR_LIMIT, judgmentOf, judgmentToStep, mostInconsistentPair, pairCount, pairKey, stepToJudgment, type AhpResult, type Judgments } from '../lib/ahp'
import { computeFor, effectiveMode, emptySaved, idKey, itemJudgmentsFor, MAX_CRITERIA, ratingOf, type AhpSaved, type ItemMode } from '../lib/ahpStore'
import { initialOf } from '../format'
import type { WishItem } from '../types'
import type { Viewport } from '../useViewport'
import { Overlay } from './DetailModal'
import { CloseIcon } from './Icons'

interface Props {
  /** Todos os itens elegíveis (desejados, dentro dos filtros ativos) — entram todos na decisão. */
  items: WishItem[]
  /** Estado da decisão, guardado pelo App (que também o usa na ordenação "Ranking AHP"). */
  saved: AhpSaved
  setSaved: (fn: (s: AhpSaved) => AhpSaved) => void
  vp: Viewport
  onClose: () => void
}

const display = 'var(--font-display)'
const mono = 'var(--font-mono)'
const label: React.CSSProperties = { fontFamily: mono, fontSize: 9.5, letterSpacing: '.12em', color: '#a3a3a3', textTransform: 'uppercase' }
const ghostBtn: React.CSSProperties = { background: '#f4f4f4', border: 'none', cursor: 'pointer', borderRadius: 12, padding: '13px 18px', fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600, color: '#0a0a0a' }
const primaryBtn: React.CSSProperties = { flex: 1, background: '#0a0a0a', border: 'none', cursor: 'pointer', borderRadius: 12, padding: 13, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#fff' }

type Step = 'criterios' | 'pesos' | 'itens' | 'resultado'

export default function AhpModal({ items, saved, setSaved, vp, onClose }: Props) {
  const { isNarrow } = vp
  const [step, setStep] = useState<Step>('criterios')
  const [critIdx, setCritIdx] = useState(0)
  const [newCrit, setNewCrit] = useState('')

  const { criteria, criteriaJudgments } = saved
  // Todos os itens elegíveis, numa ordem estável (nome) para as comparações.
  const sorted = useMemo(() => [...items].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')), [items])
  const ids = useMemo(() => sorted.map((i) => i.id), [sorted])
  const names = sorted.map((i) => i.name)
  const mode = effectiveMode(saved, ids.length)

  const patch = (p: Partial<AhpSaved>) => setSaved((s) => ({ ...s, ...p }))

  function setItemJudgment(c: number, i: number, j: number, v: number) {
    const a = ids[i]!
    const b = ids[j]!
    const stored = a < b ? v : 1 / v
    setSaved((s) => {
      const list = Array.from({ length: s.criteria.length }, (_, k) => s.itemJudgments[k] ?? {})
      list[c] = { ...list[c], [idKey(a, b)]: stored }
      return { ...s, itemJudgments: list }
    })
  }
  function setItemRating(c: number, id: string, v: number) {
    setSaved((s) => {
      const list = Array.from({ length: s.criteria.length }, (_, k) => s.itemRatings[k] ?? {})
      list[c] = { ...list[c], [id]: v }
      return { ...s, itemRatings: list }
    })
  }
  function setCriteriaJudgment(i: number, j: number, v: number) {
    patch({ criteriaJudgments: { ...criteriaJudgments, [pairKey(i, j)]: i < j ? v : 1 / v } })
  }
  function addCriterion() {
    const name = newCrit.trim()
    if (!name || criteria.length >= MAX_CRITERIA || criteria.includes(name)) return
    patch({ criteria: [...criteria, name] })
    setNewCrit('')
  }
  // Remover critério reindexa julgamentos entre critérios; os de itens saem junto com a posição.
  function removeCriterion(idx: number) {
    if (criteria.length <= 2) return
    const keep = criteria.map((_, k) => k).filter((k) => k !== idx)
    const next: Judgments = {}
    for (const [a, b] of allPairs(keep.length)) {
      const v = criteriaJudgments[pairKey(keep[a]!, keep[b]!)]
      if (v !== undefined) next[pairKey(a, b)] = v
    }
    patch({
      criteria: keep.map((k) => criteria[k]!),
      criteriaJudgments: next,
      itemJudgments: keep.map((k) => saved.itemJudgments[k] ?? {}),
      itemRatings: keep.map((k) => saved.itemRatings[k] ?? {}),
    })
    setCritIdx(0)
  }
  function setMode(m: ItemMode) {
    patch({ itemMode: m })
  }
  function reset() {
    setSaved(() => emptySaved())
    setStep('criterios')
    setCritIdx(0)
  }

  const itemJudgmentsPos = useMemo(() => criteria.map((_, c) => itemJudgmentsFor(saved, c, ids, mode)), [saved, criteria, ids, mode])
  const result = useMemo(() => computeFor(saved, ids, mode), [saved, ids, mode])

  if (items.length < 2) {
    return (
      <Overlay isNarrow={isNarrow} onClose={onClose}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: isNarrow ? 0 : 20, width: 380, maxWidth: '100%', padding: 28, textAlign: 'center', animation: 'modalIn .3s cubic-bezier(.2,.7,.2,1) both' }}>
          <div style={{ fontFamily: display, fontSize: 19, fontWeight: 700, marginBottom: 8 }}>Poucos itens pra decidir</div>
          <div style={{ fontSize: 13.5, color: '#6b6b6b', lineHeight: 1.5 }}>É preciso ter ao menos 2 itens "desejados" dentro dos filtros ativos para comparar. Ajuste os filtros e tente de novo.</div>
          <button onClick={onClose} className="press" style={{ ...primaryBtn, marginTop: 20, width: '100%', flex: 'none' }}>Fechar</button>
        </div>
      </Overlay>
    )
  }

  const steps: Step[] = ['criterios', 'pesos', 'itens', 'resultado']
  const titles: Record<Step, string> = { criterios: 'Critérios', pesos: 'Peso dos critérios', itens: 'Itens por critério', resultado: 'Ranking final' }
  const stepIdx = steps.indexOf(step)
  const back = () => {
    if (step === 'itens' && critIdx > 0) setCritIdx(critIdx - 1)
    else if (step === 'resultado') {
      setCritIdx(criteria.length - 1)
      setStep('itens')
    } else setStep(steps[Math.max(0, stepIdx - 1)]!)
  }
  const next = () => {
    if (step === 'itens' && critIdx < criteria.length - 1) setCritIdx(critIdx + 1)
    else {
      if (step === 'pesos') setCritIdx(0)
      setStep(steps[Math.min(steps.length - 1, stepIdx + 1)]!)
    }
  }

  const critResult = analyzeJudgments(criteria.length, criteriaJudgments)
  const pairsPerCrit = pairCount(ids.length)

  return (
    <Overlay isNarrow={isNarrow} onClose={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: isNarrow ? 0 : 22, width: 640, maxWidth: '100%', height: isNarrow ? '100%' : 'auto', maxHeight: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 70px rgba(0,0,0,.3)', animation: 'modalIn .3s cubic-bezier(.2,.7,.2,1) both' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #f0f0f0' }}>
          <div>
            <div style={label}>Decisão AHP · passo {stepIdx + 1} de {steps.length}</div>
            <div style={{ fontFamily: display, fontSize: 18, fontWeight: 700, marginTop: 2 }}>
              {titles[step]}
              {step === 'itens' && <span style={{ color: '#9a9a9a', fontWeight: 600 }}> · {criteria[critIdx]} ({critIdx + 1}/{criteria.length})</span>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="soft-hover" style={{ background: '#f4f4f4', border: 'none', cursor: 'pointer', width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CloseIcon size={12} color="#6b6b6b" />
          </button>
        </div>

        <div data-scroll style={{ flex: 1, overflow: 'auto', padding: isNarrow ? 18 : 26 }}>
          {step === 'criterios' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 13.5, color: '#6b6b6b', lineHeight: 1.5 }}>Defina o que importa na decisão (de 2 a {MAX_CRITERIA} critérios). Nos próximos passos você diz o quanto cada um pesa mais que os outros e avalia todos os itens em cada critério.</div>
              {criteria.map((c, idx) => (
                <div key={c} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1.5px solid #ececec', borderRadius: 12, padding: '10px 14px', fontSize: 14, fontWeight: 600 }}>
                  {c}
                  <button onClick={() => removeCriterion(idx)} disabled={criteria.length <= 2} aria-label={`Remover ${c}`} className="soft-hover" style={{ background: 'none', border: 'none', cursor: criteria.length <= 2 ? 'default' : 'pointer', opacity: criteria.length <= 2 ? 0.3 : 1, padding: 6 }}>
                    <CloseIcon size={11} color="#6b6b6b" />
                  </button>
                </div>
              ))}
              {criteria.length < MAX_CRITERIA && (
                <form onSubmit={(e) => { e.preventDefault(); addCriterion() }} style={{ display: 'flex', gap: 8 }}>
                  <input value={newCrit} onChange={(e) => setNewCrit(e.target.value)} placeholder="Novo critério (ex.: Durabilidade)" maxLength={30} style={{ flex: 1, minWidth: 0, border: '1.5px solid #e2e2e2', borderRadius: 12, padding: '11px 14px', fontFamily: 'var(--font-body)', fontSize: 14 }} />
                  <button type="submit" disabled={!newCrit.trim()} className="press" style={{ ...ghostBtn, opacity: newCrit.trim() ? 1 : 0.5 }}>Adicionar</button>
                </form>
              )}

              <div style={{ ...label, marginTop: 6 }}>Itens na decisão · todos os {ids.length} desejados nos filtros ativos</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {sorted.map((it) => (
                  <span key={it.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f6f6f6', borderRadius: 9, padding: '4px 9px 4px 4px', fontSize: 12.5, maxWidth: '100%' }}>
                    <ItemThumb item={it} size={20} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</span>
                  </span>
                ))}
              </div>

              <div style={{ ...label, marginTop: 6 }}>Como avaliar os itens</div>
              <div role="radiogroup" aria-label="Como avaliar os itens" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {([
                  ['pares', 'Comparar em pares', `${pairsPerCrit} ${pairsPerCrit === 1 ? 'par' : 'pares'} por critério`],
                  ['notas', 'Dar notas de 1 a 9', `${ids.length} notas por critério`],
                ] as const).map(([m, title, sub]) => {
                  const on = mode === m
                  return (
                    <button key={m} role="radio" aria-checked={on} onClick={() => setMode(m)} className="press" style={{ flex: '1 1 180px', textAlign: 'left', background: on ? '#0a0a0a' : '#fff', color: on ? '#fff' : '#0a0a0a', border: `1.5px solid ${on ? '#0a0a0a' : '#e2e2e2'}`, borderRadius: 12, padding: '10px 14px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{title}</div>
                      <div style={{ fontSize: 11.5, opacity: 0.7, marginTop: 2 }}>{sub}</div>
                    </button>
                  )
                })}
              </div>
              {mode === 'pares' && pairsPerCrit > 15 && (
                <div style={{ fontSize: 12.5, lineHeight: 1.45, borderRadius: 12, padding: '10px 14px', background: '#fff6e5', color: '#8a5a00' }}>
                  Com {ids.length} itens são {pairsPerCrit * criteria.length} comparações no total. Dar notas mede o mesmo de forma bem mais rápida.
                </div>
              )}
            </div>
          )}

          {step === 'pesos' && (
            <PairwiseForm
              judgments={criteriaJudgments}
              onChange={setCriteriaJudgment}
              intro="Qual critério pesa mais na sua decisão, e quanto mais?"
              result={critResult}
              labels={criteria}
            />
          )}

          {step === 'itens' && mode === 'pares' && (
            <PairwiseForm
              judgments={itemJudgmentsPos[critIdx] ?? {}}
              onChange={(i, j, v) => setItemJudgment(critIdx, i, j, v)}
              intro={`Em "${criteria[critIdx]}", qual item é melhor, e quanto?`}
              result={result.perCriterion[critIdx]!}
              labels={names}
            />
          )}

          {step === 'itens' && mode === 'notas' && (
            <RatingForm
              items={sorted}
              ratingOf={(id) => ratingOf(saved, critIdx, id)}
              onChange={(id, v) => setItemRating(critIdx, id, v)}
              criterion={criteria[critIdx]!}
              weights={result.perCriterion[critIdx]!.weights}
            />
          )}

          {step === 'resultado' && <ResultView names={names} thumbs={sorted} criteria={criteria} result={result} critResult={critResult} />}
        </div>

        <div style={{ padding: '14px 22px 20px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 11 }}>
          {step === 'resultado' ? (
            <>
              <button onClick={reset} className="soft-hover" style={ghostBtn}>Recomeçar</button>
              <button onClick={back} className="soft-hover" style={ghostBtn}>Revisar</button>
              <button onClick={onClose} className="press" style={primaryBtn}>Fechar</button>
            </>
          ) : (
            <>
              {(stepIdx > 0 || critIdx > 0) && <button onClick={back} className="soft-hover" style={ghostBtn}>Voltar</button>}
              <button onClick={next} className="press" style={primaryBtn}>
                {step === 'itens' && critIdx === criteria.length - 1 ? 'Ver ranking' : 'Continuar'}
              </button>
            </>
          )}
        </div>
      </div>
    </Overlay>
  )
}

const RATING_WORDS: Record<number, string> = { 1: 'péssimo', 2: 'muito fraco', 3: 'fraco', 4: 'abaixo da média', 5: 'médio', 6: 'acima da média', 7: 'bom', 8: 'muito bom', 9: 'excelente' }

/** Modo de notas: todos os itens numa lista, cada um com nota 1–9 no critério. */
function RatingForm({ items, ratingOf, onChange, criterion, weights }: { items: WishItem[]; ratingOf: (id: string) => number; onChange: (id: string, v: number) => void; criterion: string; weights: number[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 13.5, color: '#6b6b6b', lineHeight: 1.5 }}>Em "{criterion}", dê uma nota de 1 (pior) a 9 (melhor) a cada item. O que vale é a proporção entre as notas: um 8 conta o dobro de um 4.</div>
      {items.map((it, k) => {
        const v = ratingOf(it.id)
        return (
          <div key={it.id} style={{ border: '1.5px solid #ececec', borderRadius: 14, padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ItemThumb item={it} size={26} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</span>
              <span style={{ fontFamily: mono, fontSize: 11, color: '#9a9a9a' }}>{(weights[k]! * 100).toFixed(0)}%</span>
            </div>
            <input type="range" min={1} max={9} step={1} value={v} aria-label={`Nota de ${it.name} em ${criterion}`} onChange={(e) => onChange(it.id, Number(e.target.value))} style={{ width: '100%', margin: '8px 0 2px' }} />
            <div style={{ fontFamily: mono, fontSize: 11, color: '#9a9a9a' }}>{v} · {RATING_WORDS[v]}</div>
          </div>
        )
      })}
    </div>
  )
}

function ItemThumb({ item, size }: { item: WishItem; size: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 7, background: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
      {item.photo ? <img src={item.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontFamily: display, fontSize: size * 0.4, fontWeight: 600, color: '#c4c4c4' }}>{initialOf(item.name)}</span>}
    </div>
  )
}

/** Descrição em pt-BR de um degrau da escala de Saaty. */
function describe(step: number, a: string, b: string): string {
  if (step === 0) return 'Igual importância (1)'
  const k = Math.abs(step) + 1
  const words: Record<number, string> = { 2: 'um pouco mais', 3: 'moderadamente mais', 4: 'moderadamente a bem mais', 5: 'bem mais', 6: 'bem a muito mais', 7: 'muito mais', 8: 'muito a extremamente mais', 9: 'extremamente mais' }
  return `${step > 0 ? a : b}: ${words[k]} (${k})`
}

function ConsistencyNote({ result, n }: { result: ReturnType<typeof analyzeJudgments>; n: number }) {
  if (n < 3) return null
  const ok = result.consistent
  return (
    <div style={{ fontSize: 12.5, lineHeight: 1.45, borderRadius: 12, padding: '10px 14px', background: ok ? '#f4f4f4' : '#fff6e5', color: ok ? '#6b6b6b' : '#8a5a00' }}>
      Razão de consistência: <b style={{ fontFamily: mono }}>{result.cr.toFixed(3).replace('.', ',')}</b>{' '}
      {ok ? '— julgamentos consistentes.' : `— acima de ${String(CR_LIMIT).replace('.', ',')}. Seus julgamentos se contradizem; revise os pares destacados.`}
    </div>
  )
}

function PairwiseForm({ labels, judgments, onChange, intro, result }: { labels: string[]; judgments: Judgments; onChange: (i: number, j: number, v: number) => void; intro: string; result: ReturnType<typeof analyzeJudgments> }) {
  const suspect = !result.consistent ? mostInconsistentPair(labels.length, judgments) : null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 13.5, color: '#6b6b6b', lineHeight: 1.5 }}>{intro} Arraste para o lado de quem vence; o centro é empate.</div>
      {allPairs(labels.length).map(([i, j]) => {
        const step = judgmentToStep(judgmentOf(judgments, i, j))
        const flagged = suspect && suspect.pair[0] === i && suspect.pair[1] === j
        return (
          <div key={`${i}-${j}`} style={{ border: `1.5px solid ${flagged ? '#e8b64c' : '#ececec'}`, borderRadius: 14, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 14, fontWeight: 600 }}>
              <span style={{ fontWeight: step > 0 ? 700 : 500 }}>{labels[i]}</span>
              <span style={{ fontWeight: step < 0 ? 700 : 500, textAlign: 'right' }}>{labels[j]}</span>
            </div>
            <input
              type="range"
              min={-8}
              max={8}
              step={1}
              value={-step}
              aria-label={`${labels[i]} contra ${labels[j]}`}
              onChange={(e) => onChange(i, j, stepToJudgment(-Number(e.target.value)))}
              style={{ width: '100%', margin: '10px 0 4px' }}
            />
            <div style={{ fontFamily: mono, fontSize: 11, color: '#9a9a9a' }}>{describe(step, labels[i]!, labels[j]!)}</div>
            {flagged && <div style={{ fontSize: 12, color: '#8a5a00', marginTop: 4 }}>Par que mais destoa dos demais{suspect.suggested ? ` — o conjunto sugere cerca de ${suspect.suggested >= 1 ? Math.round(suspect.suggested) : `1/${Math.round(1 / suspect.suggested)}`}` : ''}.</div>}
          </div>
        )
      })}
      <ConsistencyNote result={result} n={labels.length} />
    </div>
  )
}

function Bar({ value, max }: { value: number; max: number }) {
  return (
    <div style={{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, height: '100%', background: '#0a0a0a', borderRadius: 4 }} />
    </div>
  )
}

function ResultView({ names, thumbs, criteria, result, critResult }: { names: string[]; thumbs: WishItem[]; criteria: string[]; result: AhpResult; critResult: ReturnType<typeof analyzeJudgments> }) {
  const top = Math.max(...result.scores)
  const warnings: string[] = []
  if (!critResult.consistent) warnings.push(`pesos dos critérios (CR ${critResult.cr.toFixed(2).replace('.', ',')})`)
  result.perCriterion.forEach((r, c) => {
    if (!r.consistent) warnings.push(`itens em "${criteria[c]}" (CR ${r.cr.toFixed(2).replace('.', ',')})`)
  })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {warnings.length > 0 && (
        <div style={{ fontSize: 12.5, lineHeight: 1.5, borderRadius: 12, padding: '10px 14px', background: '#fff6e5', color: '#8a5a00' }}>
          Atenção: julgamentos inconsistentes (CR ≥ {String(CR_LIMIT).replace('.', ',')}) em {warnings.join('; ')}. O ranking vale, mas é menos confiável — vale revisar.
        </div>
      )}
      <div>
        <div style={{ ...label, marginBottom: 10 }}>Ranking</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {result.ranking.map((idx, pos) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: '#c4c4c4', width: 16 }}>{pos + 1}</span>
              <ItemThumb item={thumbs[idx]!} size={30} />
              <span style={{ width: 140, flexShrink: 0, fontSize: 14, fontWeight: pos === 0 ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{names[idx]}</span>
              <Bar value={result.scores[idx]!} max={top} />
              <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, width: 48, textAlign: 'right' }}>{(result.scores[idx]! * 100).toFixed(1).replace('.', ',')}%</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ ...label, marginBottom: 10 }}>Peso dos critérios</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {criteria.map((c, k) => (
            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
              <span style={{ width: 120, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c}</span>
              <Bar value={critResult.weights[k]!} max={Math.max(...critResult.weights)} />
              <span style={{ fontFamily: mono, fontSize: 12, width: 48, textAlign: 'right' }}>{(critResult.weights[k]! * 100).toFixed(1).replace('.', ',')}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
