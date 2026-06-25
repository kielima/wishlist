import type { WishItem } from '../types'
import { BarsIcon, PlusSmall } from './Icons'

type Filter = 'todos' | 'desejados' | 'concluidos'
type Layout = 'editorial' | 'gallery'

interface Props {
  items: WishItem[]
  filter: Filter
  setFilter: (f: Filter) => void
  layout: Layout
  setLayout: (l: Layout) => void
  onNew: () => void
  onOpenPanel: () => void
}

const display = 'var(--font-display)'
const mono = 'var(--font-mono)'

export default function TopBar({ items, filter, setFilter, layout, setLayout, onNew, onOpenPanel }: Props) {
  const isEditorial = layout === 'editorial'
  const wanted = items.filter((i) => i.status === 'wanted').length
  const bought = items.filter((i) => i.status === 'bought').length
  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: 'todos', label: 'Todos', count: items.length },
    { key: 'desejados', label: 'Desejados', count: wanted },
    { key: 'concluidos', label: 'Concluídos', count: bought },
  ]

  const iconBtn: React.CSSProperties = { border: 'none', cursor: 'pointer', width: 40, height: 40, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }

  return (
    <div style={{ padding: 'calc(env(safe-area-inset-top) + 14px) 18px 0', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.2em', color: '#bdbdbd' }}>SUA LISTA</div>
          <div style={{ fontFamily: display, fontSize: 22, fontWeight: 700, lineHeight: 1, marginTop: 2 }}>Desejos</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onOpenPanel} style={{ ...iconBtn, background: '#f4f4f4' }}>
            <BarsIcon color="#0a0a0a" />
          </button>
          <button onClick={onNew} style={{ ...iconBtn, background: '#0a0a0a' }}>
            <PlusSmall size={16} />
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 0 12px' }}>
        <div data-scroll style={{ display: 'flex', gap: 8, overflowX: 'auto', flex: 1, minWidth: 0 }}>
          {tabs.map((tb) => {
            const active = filter === tb.key
            return (
              <button key={tb.key} onClick={() => setFilter(tb.key)} style={{ flexShrink: 0, background: active ? '#0a0a0a' : '#f4f4f4', border: 'none', cursor: 'pointer', borderRadius: 999, padding: '8px 14px', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: active ? '#fff' : '#6b6b6b' }}>
                {tb.label} {tb.count}
              </button>
            )
          })}
        </div>

        <div style={{ position: 'relative', display: 'flex', flexShrink: 0, background: '#f4f4f4', borderRadius: 999, padding: 3 }}>
          <div style={{ position: 'absolute', top: 3, bottom: 3, left: 3, width: 'calc(50% - 3px)', background: '#fff', borderRadius: 999, boxShadow: '0 1px 3px rgba(0,0,0,.10)', transition: 'transform .28s cubic-bezier(.4,0,.1,1)', transform: `translateX(${isEditorial ? '0%' : '100%'})` }} />
          <button onClick={() => setLayout('editorial')} aria-label="Lista" style={{ position: 'relative', zIndex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '7px 13px', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, color: isEditorial ? '#0a0a0a' : '#9a9a9a' }}>Lista</button>
          <button onClick={() => setLayout('gallery')} aria-label="Galeria" style={{ position: 'relative', zIndex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '7px 13px', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, color: isEditorial ? '#9a9a9a' : '#0a0a0a' }}>Galeria</button>
        </div>
      </div>
    </div>
  )
}
