import { useEffect, useMemo, useState } from 'react'
import { allPairs, analyzeJudgments, CR_LIMIT, computeAhp, judgmentOf, judgmentToStep, mostInconsistentPair, pairKey, stepToJudgment, type Judgments } from '../lib/ahp'
import { initialOf } from '../format'
import type { WishItem } from '../types'
import type { Viewport } from '../useViewport'
import { Overlay } from './DetailModal'
import { CloseIcon } from './Icons'

interface Props {
  /** Itens elegíveis (desejados, dentro dos filtros ativos). */
  items: WishItem[]
  vp: Viewport
  onClose: () => void
}

const display = 'var(--font-display)'
const mono = 'var(--font-mono)'
const label: React.CSSProperties = { fontFamily: mono, fontSize: 9.5, letterSpacing: '.12em', color: '#a3a3a3', textTransform: 'uppercase' }
const ghostBtn: React.CSSProperties = { background: '#f4f4f4', border: 'none', cursor: 'pointer', borderRadius: 12, padding: '13px 18px', fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600, color: '#0a0a0a' }
const primaryBtn: React.CSSProperties = { flex: 1, background: '#0a0a0a', border: 'none', cursor: 'pointer', borderRadius: 12, padding: 13, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#fff' }

const STORAGE_KEY = 'wishlist.ahp.v1'
const MAX_ITEMS = 8
const MAX_CRITERIA = 8
const DEFAULT_CRITERIA = ['Preço', 'Utilidade', 'Desejo']

type Step = 'criterios' | 'pesos' | 'itens' | 'resultado'

/** Estado persistido (por aparelho). Julgamentos de itens ficam indexados pelo id do item, não pela posição. */
interface Saved {
  criteria: string[]
  /** Julgamentos entre critérios, chave `"i|j"` por posição. */
  criteriaJudgments: Judgments
  selected: string[]
  /** Por critério (posição): chave `"idA|idB"` com idA < idB → quanto A é preferível a B. */
  itemJudgments: Array<Record<string, number>>
}

function load(): Saved {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const s = JSON.parse(raw) as Partial<Saved>
      if (Array.isArray(s.criteria) && s.criteria.length >= 2) {
        return { criteria: s.criteria, criteriaJudgments: s.criteriaJudgments ?? {}, selected: s.selected ?? [], itemJudgments: s.itemJudgments ?? [] }
      }
    }
  } catch {
    /* storage indisponível ou corrompido: começa do zero */
  }
  return { criteria: DEFAULT_CRITERIA, criteriaJudgments: {}, selected: [], itemJudgments: [] }
}

const idKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)

export default function AhpModal({ items, vp, onClose }: Props) {
  const { isNarrow } = vp
  const [saved, setSaved] = useState<Saved>(load)
  const [step, setStep] = useState<Step>('criterios')
  const [critIdx, setCritIdx] = useState(0)
  const [newCrit, setNewCrit] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    } catch {
      /* sem persistência: segue só em memória */
    }
  }, [saved])

  const { criteria, criteriaJudgments } = saved
  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])
  // Seleção: ids salvos ainda existentes; sem seleção válida, os primeiros itens.
  const selected = useMemo(() => {
    const valid = saved.selected.filter((id) => itemById.has(id))
    return valid.length >= 2 ? valid : items.slice(0, 5).map((i) => i.id)
  }, [saved.selected, items, itemById])

  const patch = (p: Partial<Saved>) => setSaved((s) => ({ ...s, ...p }))

  // Julgamentos de itens do critério c, convertidos para posições na seleção atual.
  function positional(c: number): Judgments {
    const out: Judgments = {}
    const store = saved.itemJudgments[c] ?? {}
    for (const [i, j] of allPairs(selected.length)) {
      const a = selected[i]!
      const b = selected[j]!
      const v = store[idKey(a, b)]
      if (v !== undefined) out[pairKey(i, j)] = a < b ? v : 1 / v
    }
    return out
  }
  function setItemJudgment(c: number, i: number, j: number, v: number) {
    const a = selected[i]!
    const b = selected[j]!
    const stored = a < b ? v : 1 / v
    setSaved((s) => {
      const list = Array.from({ length: criteria.length }, (_, k) => s.itemJudgments[k] ?? {})
      list[c] = { ...list[c], [idKey(a, b)]: stored }
      return { ...s, itemJudgments: list }
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
    })
    setCritIdx(0)
  }
  function toggleItem(id: string) {
    if (selected.includes(id)) {
      if (selected.length > 2) patch({ selected: selected.filter((x) => x !== id) })
    } else if (selected.length < MAX_ITEMS) {
      patch({ selected: [...selected, id] })
    }
  }
  function reset() {
    setSaved({ criteria: DEFAULT_CRITERIA, criteriaJudgments: {}, selected: [], itemJudgments: [] })
    setStep('criterios')
    setCritIdx(0)
  }

  const itemJudgmentsPos = useMemo(
    () => criteria.map((_, c) => positional(c)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [criteria, saved.itemJudgments, selected],
  )
  const result = useMemo(
    () => computeAhp({ criteriaCount: criteria.length, criteriaJudgments, itemCount: selected.length, itemJudgments: itemJudgmentsPos }),
    [criteria.length, criteriaJudgments, selected.length, itemJudgmentsPos],
  )

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
    else setStep(steps[Math.max(0, stepIdx - 1)]!)
  }
  const next = () => {
    if (step === 'itens' && critIdx < criteria.length - 1) setCritIdx(critIdx + 1)
    else {
      if (step === 'pesos') setCritIdx(0)
      setStep(steps[Math.min(steps.length - 1, stepIdx + 1)]!)
    }
  }

  const critResult = analyzeJudgments(criteria.length, criteriaJudgments)

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
              {step === 'itens' && <span style={{ color: '#9a9a9a', fontWeight: 600 }}> · {criteria[critIdx]}</span>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="soft-hover" style={{ background: '#f4f4f4', border: 'none', cursor: 'pointer', width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CloseIcon size={12} color="#6b6b6b" />
          </button>
        </div>

        <div data-scroll style={{ flex: 1, overflow: 'auto', padding: isNarrow ? 18 : 26 }}>
          {step === 'criterios' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 13.5, color: '#6b6b6b', lineHeight: 1.5 }}>Defina o que importa na decisão (de 2 a {MAX_CRITERIA} critérios). Nos próximos passos você diz o quanto cada um pesa mais que os outros.</div>
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
              <div style={{ ...label, marginTop: 6 }}>Itens na comparação ({selected.length}/{MAX_ITEMS})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {items.map((it) => {
                  const on = selected.includes(it.id)
                  const blocked = !on && selected.length >= MAX_ITEMS
                  return (
                    <label key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, opacity: blocked ? 0.4 : 1, cursor: blocked ? 'default' : 'pointer' }}>
                      <input type="checkbox" checked={on} disabled={blocked || (on && selected.length <= 2)} onChange={() => toggleItem(it.id)} />
                      <ItemThumb item={it} size={26} />
                      {it.name}
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {step === 'pesos' && (
            <PairwiseForm
              names={criteria}
              judgments={criteriaJudgments}
              onChange={setCriteriaJudgment}
              intro="Qual critério pesa mais na sua decisão, e quanto mais?"
              result={critResult}
              labels={criteria}
            />
          )}

          {step === 'itens' && (
            <PairwiseForm
              names={selected.map((id) => itemById.get(id)!.name)}
              judgments={itemJudgmentsPos[critIdx] ?? {}}
              onChange={(i, j, v) => setItemJudgment(critIdx, i, j, v)}
              intro={`Em "${criteria[critIdx]}", qual item é melhor, e quanto?`}
              result={result.perCriterion[critIdx]!}
              labels={selected.map((id) => itemById.get(id)!.name)}
            />
          )}

          {step === 'resultado' && (
            <ResultView
              names={selected.map((id) => itemById.get(id)!.name)}
              thumbs={selected.map((id) => itemById.get(id)!)}
              criteria={criteria}
              result={result}
              critResult={critResult}
            />
          )}
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

function PairwiseForm({ names, labels, judgments, onChange, intro, result }: { names: string[]; labels: string[]; judgments: Judgments; onChange: (i: number, j: number, v: number) => void; intro: string; result: ReturnType<typeof analyzeJudgments> }) {
  const suspect = !result.consistent ? mostInconsistentPair(names.length, judgments) : null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 13.5, color: '#6b6b6b', lineHeight: 1.5 }}>{intro} Arraste para o lado de quem vence; o centro é empate.</div>
      {allPairs(names.length).map(([i, j]) => {
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
      <ConsistencyNote result={result} n={names.length} />
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

function ResultView({ names, thumbs, criteria, result, critResult }: { names: string[]; thumbs: WishItem[]; criteria: string[]; result: ReturnType<typeof computeAhp>; critResult: ReturnType<typeof analyzeJudgments> }) {
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
