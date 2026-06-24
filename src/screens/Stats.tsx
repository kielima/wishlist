import { useEffect, useRef, useState } from 'react'
import { PRIORITIES, PRIORITY_META } from '../constants'
import { formatPrice, primaryCategory } from '../format'
import type { Priority, WishItem } from '../types'
import TabBar from '../components/TabBar'

interface Props {
  items: WishItem[]
  onHome: () => void
  onNew: () => void
  /** Sair da conta (só no modo sincronizado). */
  onSignOut?: () => void
}

const mono = 'var(--font-mono)'
const display = 'var(--font-display)'
const TOP_PAD = 'calc(env(safe-area-inset-top) + 28px)'

const sectionLabel: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 10,
  letterSpacing: '.12em',
  color: '#a3a3a3',
  textTransform: 'uppercase',
}

/** Anima um valor de 0 a 1 (ease-out cúbico) ao montar. */
function useCountUp(durationMs = 750): number {
  const [t, setT] = useState(0)
  const raf = useRef<number | undefined>(undefined)
  useEffect(() => {
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs)
      setT(1 - Math.pow(1 - p, 3))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    // Garantia: se o requestAnimationFrame for adiado/estrangulado (aba em
    // segundo plano), força o valor final para os números nunca ficarem em 0.
    const fallback = setTimeout(() => setT(1), durationMs + 80)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
      clearTimeout(fallback)
    }
  }, [durationMs])
  return t
}

export default function Stats({ items, onHome, onNew, onSignOut }: Props) {
  const t = useCountUp()

  const wanted = items.filter((i) => i.status === 'wanted')
  const bought = items.filter((i) => i.status === 'bought')
  const totalWanted = wanted.reduce((s, i) => s + (i.priceCents ?? 0), 0)
  const spent = bought.reduce((s, i) => s + (i.priceCents ?? 0), 0)
  const progress = items.length ? (bought.length / items.length) * 100 * t : 0

  // por categoria (apenas desejados)
  const catMap: Record<string, number> = {}
  wanted.forEach((i) => {
    const c = primaryCategory(i)
    catMap[c] = (catMap[c] ?? 0) + (i.priceCents ?? 0)
  })
  const catArr = Object.entries(catMap).sort((a, b) => b[1] - a[1])
  const catMax = catArr.length ? catArr[0][1] : 1

  // por prioridade (apenas desejados)
  const priBreakdown = PRIORITIES.map((p) => {
    const list = wanted.filter((i) => i.priority === p.value)
    const cents = list.reduce((s, i) => s + (i.priceCents ?? 0), 0)
    return { meta: p, count: list.length, cents }
  })

  const tick = (priority: Priority, idx: number, h: number) => (
    <div style={{ width: 5, height: h, borderRadius: 2, background: idx < PRIORITY_META[priority].ticks ? '#0a0a0a' : '#ececec' }} />
  )

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#ffffff', animation: 'popIn .3s ease both' }}>
      <div style={{ padding: `${TOP_PAD} 22px 0` }}>
        <div style={{ ...sectionLabel, letterSpacing: '.18em', fontWeight: 500 }}>RESUMO</div>
        <div style={{ fontFamily: display, fontSize: 36, fontWeight: 700, color: '#0a0a0a', letterSpacing: '-.01em', lineHeight: 1, marginTop: 2 }}>Panorama</div>
      </div>

      <div data-scroll style={{ flex: 1, overflow: 'auto', padding: '24px 22px' }}>
        {/* hero total */}
        <div style={sectionLabel}>Total a conquistar</div>
        <div style={{ fontFamily: display, fontSize: 54, fontWeight: 700, color: '#0a0a0a', letterSpacing: '-.02em', lineHeight: 1.05, marginTop: 4 }}>
          {formatPrice(Math.round(totalWanted * t))}
        </div>
        <div style={{ fontSize: 14, color: '#9a9a9a', marginTop: 4 }}>{wanted.length} itens dos sonhos restantes</div>

        {/* progresso */}
        <div style={{ marginTop: 26, border: '1px solid #ececec', borderRadius: 18, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: display, fontSize: 28, fontWeight: 700, color: '#0a0a0a', lineHeight: 1 }}>
                {bought.length}
                <span style={{ color: '#c4c4c4', fontSize: 20 }}>/{items.length}</span>
              </div>
              <div style={{ fontSize: 12, color: '#9a9a9a', marginTop: 4 }}>já conquistados</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.1em', color: '#a3a3a3', textTransform: 'uppercase' }}>Já investido</div>
              <div style={{ fontFamily: display, fontSize: 18, fontWeight: 600, color: '#0a0a0a', marginTop: 3 }}>{formatPrice(Math.round(spent * t))}</div>
            </div>
          </div>
          <div style={{ marginTop: 14, height: 7, borderRadius: 4, background: '#f0f0f0', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#0a0a0a', borderRadius: 4, width: `${progress.toFixed(1)}%` }} />
          </div>
        </div>

        {/* por categoria */}
        <div style={{ ...sectionLabel, marginTop: 28, marginBottom: 14 }}>Por categoria</div>
        {catArr.length === 0 ? (
          <div style={{ fontSize: 13, color: '#bdbdbd' }}>Sem itens desejados.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {catArr.map(([name, cents]) => (
              <div key={name}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{name}</span>
                  <span style={{ fontFamily: display, fontSize: 13, fontWeight: 600, color: '#6b6b6b' }}>{formatPrice(Math.round(cents * t))}</span>
                </div>
                <div style={{ height: 6, borderRadius: 4, background: '#f2f2f2', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#0a0a0a', borderRadius: 4, width: `${((cents / catMax) * 100 * t).toFixed(1)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* por prioridade */}
        <div style={{ ...sectionLabel, marginTop: 30, marginBottom: 12 }}>Por prioridade</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {priBreakdown.map(({ meta, count, cents }) => (
            <div key={meta.value} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid #f4f4f4' }}>
              <div style={{ width: 42, flexShrink: 0, display: 'flex', gap: 3 }}>{[0, 1, 2, 3].map((i) => <span key={i}>{tick(meta.value, i, 14)}</span>)}</div>
              <div style={{ flex: 1, fontFamily: display, fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{meta.full}</div>
              <div style={{ fontSize: 12, color: '#9a9a9a' }}>{count} itens</div>
              <div style={{ fontFamily: display, fontSize: 13.5, fontWeight: 600, color: '#0a0a0a', width: 78, textAlign: 'right' }}>{formatPrice(Math.round(cents * t))}</div>
            </div>
          ))}
        </div>

        {onSignOut && (
          <button
            onClick={onSignOut}
            style={{ marginTop: 34, width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600, color: '#bdbdbd', padding: 8 }}
          >
            Sair da conta
          </button>
        )}
      </div>

      <TabBar active="stats" onHome={onHome} onStats={() => {}} onNew={onNew} />
    </div>
  )
}
