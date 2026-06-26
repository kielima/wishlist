import { useRef } from 'react'
import { CATEGORIES, PRICE_MAX, PRICE_MIN, PRICE_STEP, PRIORITIES, SORT_OPTIONS, type SortBy } from '../constants'
import type { Priority } from '../types'
import { CloseIcon } from './Icons'

interface Props {
  open: boolean
  isNarrow: boolean
  onClose: () => void
  sortBy: SortBy
  setSortBy: (s: SortBy) => void
  priorities: Priority[]
  togglePriority: (p: Priority) => void
  priceMin: number
  priceMax: number
  setPriceMin: (v: number) => void
  setPriceMax: (v: number) => void
  selectedCats: string[]
  toggleCat: (c: string) => void
  onClear: () => void
  resultCount: number
}

const display = 'var(--font-display)'
const mono = 'var(--font-mono)'
const label: React.CSSProperties = { fontFamily: mono, fontSize: 9.5, letterSpacing: '.12em', color: '#a3a3a3', textTransform: 'uppercase' }

/** Drawer direito de refino: ordenação, prioridade, faixa de preço e categorias. */
export default function FilterDrawer({
  open,
  isNarrow,
  onClose,
  sortBy,
  setSortBy,
  priorities,
  togglePriority,
  priceMin,
  priceMax,
  setPriceMin,
  setPriceMax,
  selectedCats,
  toggleCat,
  onClear,
  resultCount,
}: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<'min' | 'max' | null>(null)

  const span = PRICE_MAX - PRICE_MIN
  const minPct = ((priceMin - PRICE_MIN) / span) * 100
  const maxPct = ((priceMax - PRICE_MIN) / span) * 100
  const priceLabel =
    'R$ ' + priceMin.toLocaleString('pt-BR') + ' — R$ ' + priceMax.toLocaleString('pt-BR') + (priceMax >= PRICE_MAX ? '+' : '')

  function moveTo(clientX: number) {
    const track = trackRef.current
    const which = dragRef.current
    if (!track || !which) return
    const r = track.getBoundingClientRect()
    let pct = (clientX - r.left) / r.width
    pct = Math.max(0, Math.min(1, pct))
    let val = PRICE_MIN + pct * span
    val = Math.round(val / PRICE_STEP) * PRICE_STEP
    if (which === 'min') setPriceMin(Math.min(val, priceMax))
    else setPriceMax(Math.max(val, priceMin))
  }

  function startDrag(which: 'min' | 'max', e: React.PointerEvent) {
    e.preventDefault()
    dragRef.current = which
    const move = (ev: PointerEvent) => moveTo(ev.clientX)
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      dragRef.current = null
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const optBtn = (active: boolean): React.CSSProperties => ({
    cursor: 'pointer',
    borderRadius: 11,
    padding: 12,
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'left',
    background: active ? '#0a0a0a' : '#fff',
    color: active ? '#fff' : '#1a1a1a',
    border: active ? '1.5px solid #0a0a0a' : '1.5px solid #ececec',
  })

  const handle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    width: 22,
    height: 22,
    margin: '-11px 0 0 -11px',
    borderRadius: '50%',
    background: '#fff',
    border: '2px solid #0a0a0a',
    boxShadow: '0 2px 6px rgba(0,0,0,.18)',
    cursor: 'grab',
    touchAction: 'none',
  }

  return (
    <aside
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: isNarrow ? '100%' : 372,
        maxWidth: '100%',
        background: '#fff',
        borderLeft: '1px solid #f0f0f0',
        zIndex: 43,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-12px 0 40px rgba(0,0,0,.12)',
        transition: 'transform .34s cubic-bezier(.3,.7,.2,1)',
        transform: open ? 'translateX(0%)' : 'translateX(100%)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 24px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.16em', color: '#bdbdbd' }}>REFINAR</div>
          <div style={{ fontFamily: display, fontSize: 22, fontWeight: 700, lineHeight: 1, marginTop: 3 }}>Filtros</div>
        </div>
        <button onClick={onClose} className="soft-hover" style={{ background: '#f4f4f4', border: 'none', cursor: 'pointer', width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CloseIcon size={13} color="#6b6b6b" />
        </button>
      </div>

      <div data-scroll style={{ flex: 1, overflow: 'auto', padding: '22px 24px 16px' }}>
        <div style={{ ...label, marginBottom: 11 }}>Ordenar por</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
          {SORT_OPTIONS.map((o) => (
            <button key={o.value} onClick={() => setSortBy(o.value)} className="press" style={optBtn(sortBy === o.value)}>
              {o.label}
            </button>
          ))}
        </div>

        <div style={{ ...label, margin: '24px 0 11px' }}>Prioridade</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
          {PRIORITIES.map((p) => (
            <button key={p.value} onClick={() => togglePriority(p.value)} className="press" style={{ ...optBtn(priorities.includes(p.value)), fontFamily: display }}>
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '24px 0 14px' }}>
          <span style={label}>Faixa de preço</span>
          <span style={{ fontFamily: display, fontSize: 13, fontWeight: 600 }}>{priceLabel}</span>
        </div>
        <div style={{ padding: '0 11px' }}>
          <div ref={trackRef} style={{ position: 'relative', height: 4, borderRadius: 3, background: '#ececec', margin: '16px 0' }}>
            <div style={{ position: 'absolute', top: 0, bottom: 0, borderRadius: 3, background: '#0a0a0a', left: `${minPct}%`, width: `${maxPct - minPct}%` }} />
            <div onPointerDown={(e) => startDrag('min', e)} style={{ ...handle, left: `${minPct}%` }} />
            <div onPointerDown={(e) => startDrag('max', e)} style={{ ...handle, left: `${maxPct}%` }} />
          </div>
        </div>

        <div style={{ ...label, margin: '24px 0 11px' }}>Categorias</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map((c) => {
            const active = selectedCats.includes(c)
            return (
              <button key={c} onClick={() => toggleCat(c)} className="press" style={{ cursor: 'pointer', borderRadius: 999, padding: '8px 14px', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, background: active ? '#0a0a0a' : '#fff', color: active ? '#fff' : '#6b6b6b', border: active ? '1.5px solid #0a0a0a' : '1.5px solid #ececec' }}>
                {c}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ padding: '14px 24px 20px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 11 }}>
        <button onClick={onClear} className="soft-hover" style={{ flexShrink: 0, background: '#f4f4f4', border: 'none', cursor: 'pointer', borderRadius: 12, padding: '13px 18px', fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600, color: '#0a0a0a' }}>
          Limpar
        </button>
        <button onClick={onClose} className="press" style={{ flex: 1, background: '#0a0a0a', border: 'none', cursor: 'pointer', borderRadius: 12, padding: 13, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#fff' }}>
          Ver {resultCount} {resultCount === 1 ? 'item' : 'itens'}
        </button>
      </div>
    </aside>
  )
}
