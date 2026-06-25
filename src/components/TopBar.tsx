import type { WishItem } from '../types'
import { formatPrice } from '../format'

type Filter = 'todos' | 'desejados' | 'concluidos'
type Layout = 'editorial' | 'gallery'

interface Props {
  items: WishItem[]
  filter: Filter
  setFilter: (f: Filter) => void
  layout: Layout
  setLayout: (l: Layout) => void
  totalWantedCents: number
}

const display = 'var(--font-display)'
const mono = 'var(--font-mono)'

export default function TopBar({ items, filter, setFilter, layout, setLayout, totalWantedCents }: Props) {
  const wanted = items.filter((i) => i.status === 'wanted').length
  const bought = items.filter((i) => i.status === 'bought').length
  const isEditorial = layout === 'editorial'
  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: 'todos', label: 'Todos', count: items.length },
    { key: 'desejados', label: 'Desejados', count: wanted },
    { key: 'concluidos', label: 'Concluídos', count: bought },
  ]

  return (
    <div style={{ padding: 'calc(env(safe-area-inset-top) + 14px) 22px 0', borderBottom: '1px solid #f0f0f0', background: '#fff' }}>
      {/* Título + total */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.2em', color: '#bdbdbd' }}>SUA LISTA</div>
          <div style={{ fontFamily: display, fontSize: 30, fontWeight: 700, lineHeight: 1, marginTop: 3, letterSpacing: '-.01em' }}>Desejos</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: display, fontSize: 20, fontWeight: 700, color: '#0a0a0a', lineHeight: 1 }}>{formatPrice(totalWantedCents)}</div>
          <div style={{ fontSize: 12, color: '#9a9a9a', marginTop: 3 }}>{items.length} itens</div>
        </div>
      </div>

      {/* Abas de filtro (sublinhado) */}
      <div data-scroll style={{ display: 'flex', gap: 20, overflowX: 'auto', marginTop: 16 }}>
        {tabs.map((tb) => {
          const active = filter === tb.key
          return (
            <button
              key={tb.key}
              onClick={() => setFilter(tb.key)}
              style={{
                flexShrink: 0,
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${active ? '#0a0a0a' : 'transparent'}`,
                cursor: 'pointer',
                padding: '4px 0 10px',
                fontFamily: 'var(--font-body)',
                fontSize: 15,
                fontWeight: 600,
                color: active ? '#0a0a0a' : '#9a9a9a',
              }}
            >
              {tb.label} <span style={{ color: active ? '#0a0a0a' : '#c4c4c4', fontWeight: 700 }}>{tb.count}</span>
            </button>
          )
        })}
      </div>

      {/* Toggle Lista / Galeria (largura total) */}
      <div style={{ position: 'relative', display: 'flex', background: '#f4f4f4', borderRadius: 13, padding: 4, margin: '14px 0' }}>
        <div
          style={{
            position: 'absolute',
            top: 4,
            bottom: 4,
            left: 4,
            width: 'calc(50% - 4px)',
            background: '#fff',
            borderRadius: 10,
            boxShadow: '0 1px 4px rgba(0,0,0,.10)',
            transition: 'transform .28s cubic-bezier(.4,0,.1,1)',
            transform: `translateX(${isEditorial ? '0%' : '100%'})`,
          }}
        />
        <button onClick={() => setLayout('editorial')} style={{ position: 'relative', zIndex: 1, flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: isEditorial ? '#0a0a0a' : '#9a9a9a' }}>Lista</button>
        <button onClick={() => setLayout('gallery')} style={{ position: 'relative', zIndex: 1, flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: isEditorial ? '#9a9a9a' : '#0a0a0a' }}>Galeria</button>
      </div>
    </div>
  )
}
