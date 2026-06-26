import { formatPrice } from '../format'
import { BarsIcon, FilterIcon, SearchIcon } from './Icons'

type Layout = 'editorial' | 'gallery'

interface Props {
  heading: string
  resultCount: number
  totalWantedCents: number
  query: string
  setQuery: (q: string) => void
  layout: Layout
  setLayout: (l: Layout) => void
  panelOpen: boolean
  onTogglePanel: () => void
  filterOpen: boolean
  filterCount: number
  onOpenFilter: () => void
}

const display = 'var(--font-display)'
const mono = 'var(--font-mono)'

export default function Header({ heading, resultCount, totalWantedCents, query, setQuery, layout, setLayout, panelOpen, onTogglePanel, filterOpen, filterCount, onOpenFilter }: Props) {
  const isEditorial = layout === 'editorial'
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '26px 28px 18px', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <div style={{ fontFamily: display, fontSize: 26, fontWeight: 700, letterSpacing: '-.01em' }}>{heading}</div>
        <div style={{ fontSize: 13.5, color: '#9a9a9a' }}>{resultCount} itens · {formatPrice(totalWantedCents)}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f4f4f4', borderRadius: 11, padding: '9px 13px', width: 200 }}>
          <SearchIcon />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar…" style={{ border: 'none', background: 'none', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 13.5, color: '#0a0a0a', width: '100%' }} />
        </div>

        <div style={{ position: 'relative', display: 'flex', background: '#f4f4f4', borderRadius: 11, padding: 3 }}>
          <div style={{ position: 'absolute', top: 3, bottom: 3, left: 3, width: 'calc(50% - 3px)', background: '#fff', borderRadius: 9, boxShadow: '0 1px 3px rgba(0,0,0,.10)', transition: 'transform .28s cubic-bezier(.4,0,.1,1)', transform: `translateX(${isEditorial ? '0%' : '100%'})` }} />
          <button onClick={() => setLayout('editorial')} style={{ position: 'relative', zIndex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: isEditorial ? '#0a0a0a' : '#9a9a9a' }}>Lista</button>
          <button onClick={() => setLayout('gallery')} style={{ position: 'relative', zIndex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: isEditorial ? '#9a9a9a' : '#0a0a0a' }}>Galeria</button>
        </div>

        <button onClick={onOpenFilter} style={{ background: filterOpen ? '#0a0a0a' : '#fff', border: `1px solid ${filterOpen ? '#0a0a0a' : '#e2e2e2'}`, cursor: 'pointer', borderRadius: 11, padding: '9px 15px', fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600, color: filterOpen ? '#fff' : '#0a0a0a', display: 'flex', alignItems: 'center', gap: 8, transition: 'all .15s' }}>
          <FilterIcon color="currentColor" />
          Filtros
          {filterCount > 0 && (
            <span style={{ minWidth: 18, height: 18, padding: '0 5px', boxSizing: 'border-box', borderRadius: 9, background: filterOpen ? '#fff' : '#0a0a0a', color: filterOpen ? '#0a0a0a' : '#fff', fontFamily: mono, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{filterCount}</span>
          )}
        </button>

        <button onClick={onTogglePanel} style={{ background: panelOpen ? '#0a0a0a' : '#fff', border: `1px solid ${panelOpen ? '#0a0a0a' : '#e2e2e2'}`, cursor: 'pointer', borderRadius: 11, padding: '9px 15px', fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600, color: panelOpen ? '#fff' : '#0a0a0a', display: 'flex', alignItems: 'center', gap: 8, transition: 'all .15s' }}>
          <BarsIcon color="currentColor" />
          Resumo
        </button>
      </div>
    </div>
  )
}
