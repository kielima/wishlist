import { primaryCategory } from '../format'
import type { WishItem } from '../types'
import { GearIcon, PlusSmall, SidebarIcon } from './Icons'

type Filter = 'desejados' | 'concluidos' | 'favoritos'

interface Props {
  items: WishItem[]
  filter: Filter
  setFilter: (f: Filter) => void
  /** Todas as categorias gerenciáveis (fonte de verdade da ordem/nomes). */
  allCategories: string[]
  categories: string[]
  toggleCategory: (c: string) => void
  clearCategories: () => void
  onNew: () => void
  onCollapse: () => void
  onManageCategories: () => void
}

const display = 'var(--font-display)'
const mono = 'var(--font-mono)'

const navLabel: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 9.5,
  letterSpacing: '.14em',
  color: '#bdbdbd',
  textTransform: 'uppercase',
  padding: '0 8px 8px',
}

export default function Sidebar({ items, filter, setFilter, allCategories, categories, toggleCategory, clearCategories, onNew, onCollapse, onManageCategories }: Props) {
  const wanted = items.filter((i) => i.status === 'wanted').length
  const bought = items.filter((i) => i.status === 'bought').length
  const favorites = items.filter((i) => i.favorite).length

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: 'desejados', label: 'Desejados', count: wanted },
    { key: 'concluidos', label: 'Concluídos', count: bought },
    { key: 'favoritos', label: 'Favoritos', count: favorites },
  ]

  const counts: Record<string, number> = {}
  items.forEach((i) => {
    const c = primaryCategory(i)
    counts[c] = (counts[c] ?? 0) + 1
  })
  const catNav = [{ name: 'Todas', key: null as string | null, count: items.length }].concat(
    allCategories.filter((c) => counts[c]).map((c) => ({ name: c, key: c as string | null, count: counts[c] })),
  )

  return (
    <aside style={{ width: 248, flexShrink: 0, borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', padding: '26px 18px 20px' }}>
      <div style={{ padding: '0 8px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.2em', color: '#bdbdbd', fontWeight: 500 }}>SUA LISTA</div>
          <div style={{ fontFamily: display, fontSize: 25, fontWeight: 700, letterSpacing: '-.01em', lineHeight: 1, marginTop: 3 }}>Desejos</div>
        </div>
        <button
          onClick={onCollapse}
          title="Ocultar coluna"
          aria-label="Ocultar coluna"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 9, padding: 6, marginTop: -2, marginRight: -4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bdbdbd', flexShrink: 0 }}
        >
          <SidebarIcon color="currentColor" />
        </button>
      </div>

      <button
        onClick={onNew}
        className="press"
        style={{ marginTop: 22, background: '#0a0a0a', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: 13, padding: 13, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        <PlusSmall />
        Novo desejo
      </button>

      <div data-scroll style={{ flex: 1, overflow: 'auto', marginTop: 24 }}>
        <div style={navLabel}>Status</div>
        {tabs.map((tb) => {
          const active = filter === tb.key
          return (
            <button
              key={tb.key}
              onClick={() => setFilter(tb.key)}
              style={{ width: '100%', background: active ? '#f4f4f4' : 'transparent', border: 'none', cursor: 'pointer', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: active ? '#0a0a0a' : '#6b6b6b', marginBottom: 2 }}
            >
              <span>{tb.label}</span>
              <span style={{ fontFamily: display, fontSize: 12, fontWeight: 600, color: active ? '#0a0a0a' : '#c4c4c4' }}>{tb.count}</span>
            </button>
          )
        })}

        <div style={{ ...navLabel, padding: '18px 8px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Categorias</span>
          <button
            onClick={onManageCategories}
            title="Gerir categorias"
            aria-label="Gerir categorias"
            className="soft-hover"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 7, padding: 3, margin: '-3px -3px -3px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bdbdbd' }}
          >
            <GearIcon size={14} color="currentColor" />
          </button>
        </div>
        {catNav.map((c) => {
          const active = c.key === null ? categories.length === 0 : categories.includes(c.key)
          return (
            <button
              key={c.name}
              onClick={() => (c.key === null ? clearCategories() : toggleCategory(c.key))}
              style={{ width: '100%', background: active ? '#f4f4f4' : 'transparent', border: 'none', cursor: 'pointer', borderRadius: 10, padding: '9px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: active ? 700 : 600, color: active ? '#0a0a0a' : '#6b6b6b', marginBottom: 1 }}
            >
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
              <span style={{ fontFamily: display, fontSize: 11.5, color: active ? '#0a0a0a' : '#c4c4c4', flexShrink: 0, marginLeft: 8 }}>{c.count}</span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
