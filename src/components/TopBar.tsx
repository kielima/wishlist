import type { WishItem } from '../types'
import { BarsIcon, PlusSmall } from './Icons'

type Filter = 'todos' | 'desejados' | 'concluidos'

interface Props {
  items: WishItem[]
  filter: Filter
  setFilter: (f: Filter) => void
  onNew: () => void
  onOpenPanel: () => void
}

const display = 'var(--font-display)'
const mono = 'var(--font-mono)'

export default function TopBar({ items, filter, setFilter, onNew, onOpenPanel }: Props) {
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
      <div data-scroll style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '14px 0 12px' }}>
        {tabs.map((tb) => {
          const active = filter === tb.key
          return (
            <button key={tb.key} onClick={() => setFilter(tb.key)} style={{ flexShrink: 0, background: active ? '#0a0a0a' : '#f4f4f4', border: 'none', cursor: 'pointer', borderRadius: 999, padding: '8px 14px', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: active ? '#fff' : '#6b6b6b' }}>
              {tb.label} {tb.count}
            </button>
          )
        })}
      </div>
    </div>
  )
}
