import type { WishItem } from '../types'
import { formatPrice } from '../format'
import { FilterIcon } from './Icons'

type Filter = 'todos' | 'desejados' | 'concluidos' | 'favoritos'
type Layout = 'editorial' | 'gallery'

interface Props {
  items: WishItem[]
  filter: Filter
  setFilter: (f: Filter) => void
  layout: Layout
  setLayout: (l: Layout) => void
  totalWantedCents: number
  filterCount: number
  onOpenFilter: () => void
}

const display = 'var(--font-display)'
const mono = 'var(--font-mono)'

export default function TopBar({ items, filter, setFilter, layout, setLayout, totalWantedCents, filterCount, onOpenFilter }: Props) {
  const wanted = items.filter((i) => i.status === 'wanted').length
  const bought = items.filter((i) => i.status === 'bought').length
  const favorites = items.filter((i) => i.favorite).length
  const isEditorial = layout === 'editorial'
  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: 'todos', label: 'Todos', count: items.length },
    { key: 'desejados', label: 'Desejados', count: wanted },
    { key: 'concluidos', label: 'Concluídos', count: bought },
    { key: 'favoritos', label: 'Favoritos', count: favorites },
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

      {/* Toggle Lista / Galeria + Filtros */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 8, margin: '14px 0' }}>
        <div style={{ position: 'relative', display: 'flex', flex: 1, background: '#f4f4f4', borderRadius: 13, padding: 4 }}>
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
        <button onClick={onOpenFilter} className="press" style={{ position: 'relative', flexShrink: 0, background: filterCount ? '#0a0a0a' : '#fff', border: `1.5px solid ${filterCount ? '#0a0a0a' : '#e2e2e2'}`, cursor: 'pointer', borderRadius: 13, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: filterCount ? '#fff' : '#0a0a0a' }}>
          <FilterIcon color="currentColor" />
          Filtros
          {filterCount > 0 && (
            <span style={{ minWidth: 18, height: 18, padding: '0 5px', boxSizing: 'border-box', borderRadius: 9, background: '#fff', color: '#0a0a0a', fontFamily: mono, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{filterCount}</span>
          )}
        </button>
      </div>
    </div>
  )
}
