import { useEffect, useMemo, useState } from 'react'
import { classifyConfidence, classifyVolatility, computeVolatilityBands, DEFAULT_RATING, type GlickoRating, type VolatilityBands } from '../lib/glicko2'
import { applySessionDuels, pickNextPair, recommendedDuelLimit, summarizeChanges, reorderByRating, type Pair } from '../lib/duelPairing'
import type { RatingMap } from '../duelRepository'
import { formatPrice, initialOf, primaryCategory } from '../format'
import { toBRLCents, useRates } from '../currency'
import type { Viewport } from '../useViewport'
import type { WishItem } from '../types'
import { Overlay } from './DetailModal'
import { CloseIcon } from './Icons'

interface Props {
  /** Itens elegíveis para duelo — já restritos a "desejados" e aos filtros ativos pelo chamador. */
  items: WishItem[]
  ratings: RatingMap
  vp: Viewport
  onClose: () => void
  /** Persiste a sessão (via `useDuelRatings().applySession`) e retorna o mapa atualizado. */
  onApplySession: (duels: Array<{ winnerId: string; loserId: string }>) => Promise<RatingMap>
}

const display = 'var(--font-display)'
const mono = 'var(--font-mono)'
const label: React.CSSProperties = { fontFamily: mono, fontSize: 9.5, letterSpacing: '.12em', color: '#a3a3a3', textTransform: 'uppercase' }

function ratingOf(ratings: RatingMap, id: string): GlickoRating {
  return ratings[id] ?? DEFAULT_RATING
}

type MatchLogEntry = { pair: Pair; winnerId: string; loserId: string }

export default function DuelModal({ items, ratings, vp, onClose, onApplySession }: Props) {
  const { isNarrow } = vp
  const rates = useRates()

  const eligible = items
  const eligibleIds = useMemo(() => eligible.map((i) => i.id), [eligible])
  const itemById = useMemo(() => new Map(eligible.map((i) => [i.id, i])), [eligible])

  const [phase, setPhase] = useState<'dueling' | 'summary'>('dueling')
  const [matchLog, setMatchLog] = useState<MatchLogEntry[]>([])
  const [currentPair, setCurrentPair] = useState<Pair | null>(null)
  const [limit, setLimit] = useState(() => recommendedDuelLimit(eligibleIds, ratings))
  const [saving, setSaving] = useState(false)

  // Ratings "projetados": os ratings de partida + o efeito, ainda não salvo, dos
  // duelos já respondidos nesta sessão (uma única rating period do Glicko-2).
  const projectedRatings = useMemo(() => {
    const changed = matchLog.length ? applySessionDuels(ratings, matchLog.map((m) => ({ winnerId: m.winnerId, loserId: m.loserId }))) : {}
    return { ...ratings, ...changed }
  }, [ratings, matchLog])

  // O limite de duelos da sessão é recalculado até o primeiro duelo, depois congela.
  useEffect(() => {
    if (matchLog.length === 0) setLimit(recommendedDuelLimit(eligibleIds, ratings))
  }, [eligibleIds, ratings, matchLog.length])

  // Sorteia o próximo par sempre que o histórico de duelos muda (responder ou desfazer).
  useEffect(() => {
    if (phase !== 'dueling') return
    const last = matchLog.length ? matchLog[matchLog.length - 1]!.pair : null
    setCurrentPair(pickNextPair({ candidateIds: eligibleIds, ratings: projectedRatings, lastPair: last }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchLog, phase, eligibleIds])

  const bands: VolatilityBands = useMemo(
    () => computeVolatilityBands(eligibleIds.map((id) => ratingOf(projectedRatings, id).sigma)),
    [eligibleIds, projectedRatings],
  )

  if (eligible.length < 2) {
    return (
      <Overlay isNarrow={isNarrow} onClose={onClose}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: isNarrow ? 0 : 20, width: 380, maxWidth: '100%', padding: 28, textAlign: 'center', animation: 'modalIn .3s cubic-bezier(.2,.7,.2,1) both' }}>
          <div style={{ fontFamily: display, fontSize: 19, fontWeight: 700, marginBottom: 8 }}>Poucos itens pra duelar</div>
          <div style={{ fontSize: 13.5, color: '#6b6b6b', lineHeight: 1.5 }}>É preciso ter ao menos 2 itens "desejados" dentro dos filtros ativos para montar um duelo. Ajuste os filtros e tente de novo.</div>
          <button onClick={onClose} className="press" style={{ marginTop: 20, width: '100%', background: '#0a0a0a', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: 12, padding: 13, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600 }}>
            Fechar
          </button>
        </div>
      </Overlay>
    )
  }

  async function requestClose() {
    if (matchLog.length === 0) {
      onClose()
      return
    }
    setSaving(true)
    try {
      await onApplySession(matchLog.map((m) => ({ winnerId: m.winnerId, loserId: m.loserId })))
    } finally {
      setSaving(false)
      onClose()
    }
  }

  function handlePick(winnerId: string, loserId: string) {
    if (!currentPair || saving) return
    const nextLog = [...matchLog, { pair: currentPair, winnerId, loserId }]
    setMatchLog(nextLog)
    if (nextLog.length >= limit) setPhase('summary')
  }

  function handleUndo() {
    if (matchLog.length === 0) return
    setMatchLog((prev) => prev.slice(0, -1))
    setPhase('dueling')
  }

  function handleSkip() {
    if (!currentPair) return
    setCurrentPair(pickNextPair({ candidateIds: eligibleIds, ratings: projectedRatings, lastPair: currentPair }))
  }

  const summary = useMemo(() => {
    if (phase !== 'summary') return null
    const initialOrder = reorderByRating(eligibleIds, new Set(eligibleIds), ratings)
    const newOrder = reorderByRating(eligibleIds, new Set(eligibleIds), projectedRatings)
    return summarizeChanges(initialOrder, newOrder)
  }, [phase, eligibleIds, ratings, projectedRatings])

  const cardTitle = phase === 'dueling' ? 'Qual você prefere?' : 'Fim da rodada'

  return (
    <Overlay isNarrow={isNarrow} onClose={requestClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: isNarrow ? 0 : 22, width: 640, maxWidth: '100%', height: isNarrow ? '100%' : 'auto', maxHeight: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 70px rgba(0,0,0,.3)', animation: 'modalIn .3s cubic-bezier(.2,.7,.2,1) both' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #f0f0f0' }}>
          <div>
            <div style={label}>Duelo · ranking de prioridade</div>
            <div style={{ fontFamily: display, fontSize: 18, fontWeight: 700, marginTop: 2 }}>{cardTitle}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {phase === 'dueling' && (
              <span style={{ fontFamily: mono, fontSize: 12, color: '#9a9a9a' }}>
                {Math.min(matchLog.length + 1, limit)} / {limit}
              </span>
            )}
            <button onClick={requestClose} disabled={saving} className="soft-hover" style={{ background: '#f4f4f4', border: 'none', cursor: saving ? 'default' : 'pointer', width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: saving ? 0.5 : 1 }}>
              <CloseIcon size={12} color="#6b6b6b" />
            </button>
          </div>
        </div>

        <div data-scroll style={{ flex: 1, overflow: 'auto', padding: isNarrow ? 18 : 26 }}>
          {phase === 'dueling' && currentPair ? (
            <>
              <div style={{ display: 'flex', flexDirection: isNarrow ? 'column' : 'row', alignItems: 'stretch', gap: isNarrow ? 12 : 0 }}>
                <DuelCard item={itemById.get(currentPair[0])!} rating={ratingOf(projectedRatings, currentPair[0])} bands={bands} rates={rates} onPick={() => handlePick(currentPair[0], currentPair[1])} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: isNarrow ? '100%' : 46, padding: isNarrow ? 0 : undefined }}>
                  <span style={{ fontFamily: display, fontSize: 13, fontWeight: 700, color: '#c4c4c4' }}>vs</span>
                </div>
                <DuelCard item={itemById.get(currentPair[1])!} rating={ratingOf(projectedRatings, currentPair[1])} bands={bands} rates={rates} onPick={() => handlePick(currentPair[1], currentPair[0])} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 20 }}>
                {matchLog.length > 0 && (
                  <button onClick={handleUndo} className="soft-hover" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#6b6b6b', padding: '7px 11px', borderRadius: 9 }}>
                    Desfazer
                  </button>
                )}
                <button onClick={handleSkip} className="soft-hover" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#6b6b6b', padding: '7px 11px', borderRadius: 9 }}>
                  Pular este par
                </button>
              </div>
            </>
          ) : (
            summary && <DuelSummaryView summary={summary} itemById={itemById} />
          )}
        </div>

        {phase === 'summary' && (
          <div style={{ padding: '14px 22px 20px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 11 }}>
            {matchLog.length > 0 && (
              <button onClick={handleUndo} disabled={saving} className="soft-hover" style={{ flexShrink: 0, background: '#f4f4f4', border: 'none', cursor: 'pointer', borderRadius: 12, padding: '13px 18px', fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600, color: '#0a0a0a' }}>
                Desfazer último
              </button>
            )}
            <button onClick={requestClose} disabled={saving} className="press" style={{ flex: 1, background: '#0a0a0a', border: 'none', cursor: 'pointer', borderRadius: 12, padding: 13, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#fff', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Salvando…' : 'Voltar para a lista'}
            </button>
          </div>
        )}
      </div>
    </Overlay>
  )
}

function DuelCard({ item, rating, bands, rates, onPick }: { item: WishItem; rating: GlickoRating; bands: VolatilityBands; rates: ReturnType<typeof useRates>; onPick: () => void }) {
  const confidence = classifyConfidence(rating.rd)
  const volatility = classifyVolatility(rating.sigma, bands)
  return (
    <button onClick={onPick} className="press soft-hover" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, background: '#fff', border: '1.5px solid #ececec', borderRadius: 18, padding: '22px 16px', cursor: 'pointer' }}>
      <div style={{ width: 76, height: 76, borderRadius: 16, background: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
        {item.photo ? <img src={item.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontFamily: display, fontSize: 30, fontWeight: 600, color: '#dcdcdc' }}>{initialOf(item.name)}</span>}
      </div>
      <div style={{ fontFamily: display, fontSize: 15.5, fontWeight: 700, lineHeight: 1.25 }}>{item.name}</div>
      <div style={{ fontSize: 12, color: '#9a9a9a' }}>
        {primaryCategory(item)} · {formatPrice(toBRLCents(item.priceCents, item.currency, rates))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Badge text={`Confiança ${confidence}`} />
        <Badge text={`Volatilidade ${volatility}`} />
      </div>
    </button>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.04em', color: '#8a8a8a', background: '#f4f4f4', borderRadius: 999, padding: '4px 9px', textTransform: 'uppercase' }}>{text}</span>
  )
}

function DuelSummaryView({ summary, itemById }: { summary: ReturnType<typeof summarizeChanges>; itemById: Map<string, WishItem> }) {
  const name = (id: string) => itemById.get(id)?.name ?? '—'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <div style={{ ...label, marginBottom: 10 }}>Nova ordem (top 3)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {summary.newTop.map((id, i) => (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: '#c4c4c4', width: 16 }}>{i + 1}</span>
              <span style={{ fontWeight: 600 }}>{name(id)}</span>
            </div>
          ))}
        </div>
      </div>
      {summary.risers.length > 0 && (
        <div>
          <div style={{ ...label, marginBottom: 10 }}>Subiram</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {summary.risers.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13.5 }}>
                <span>{name(r.id)}</span>
                <span style={{ fontFamily: mono, fontSize: 12, color: '#0a0a0a', fontWeight: 600 }}>▲ {r.delta}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {summary.fallers.length > 0 && (
        <div>
          <div style={{ ...label, marginBottom: 10 }}>Desceram</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {summary.fallers.map((f) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13.5 }}>
                <span>{name(f.id)}</span>
                <span style={{ fontFamily: mono, fontSize: 12, color: '#9a9a9a', fontWeight: 600 }}>▼ {Math.abs(f.delta)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
