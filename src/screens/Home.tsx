import { PRIORITY_META } from '../constants'
import { formatPrice, initialOf, primaryCategory, sortItems } from '../format'
import type { WishItem } from '../types'
import { CheckIcon } from '../components/Icons'
import TabBar from '../components/TabBar'

type Filter = 'todos' | 'desejados' | 'concluidos'
type Layout = 'editorial' | 'gallery'

interface Props {
  items: WishItem[]
  filter: Filter
  setFilter: (f: Filter) => void
  layout: Layout
  setLayout: (l: Layout) => void
  onOpen: (id: string) => void
  onNew: () => void
  onStats: () => void
}

const mono = 'var(--font-mono)'
const display = 'var(--font-display)'

const TOP_PAD = 'calc(env(safe-area-inset-top) + 28px)'

export default function Home({ items, filter, setFilter, layout, setLayout, onOpen, onNew, onStats }: Props) {
  const wanted = items.filter((i) => i.status === 'wanted')
  const bought = items.filter((i) => i.status === 'bought')
  const totalWanted = wanted.reduce((s, i) => s + (i.priceCents ?? 0), 0)

  const filterFn =
    filter === 'desejados'
      ? (i: WishItem) => i.status === 'wanted'
      : filter === 'concluidos'
        ? (i: WishItem) => i.status === 'bought'
        : () => true
  const visible = sortItems(items).filter(filterFn)

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: 'todos', label: 'Todos', count: items.length },
    { key: 'desejados', label: 'Desejados', count: wanted.length },
    { key: 'concluidos', label: 'Concluídos', count: bought.length },
  ]

  const isEditorial = layout === 'editorial'

  return (
    <>
      <div style={{ padding: `${TOP_PAD} 22px 0` }}>
        <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '.18em', color: '#a3a3a3', fontWeight: 500 }}>
          SUA LISTA
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 2 }}>
          <div style={{ fontFamily: display, fontSize: 36, fontWeight: 700, color: '#0a0a0a', letterSpacing: '-.01em', lineHeight: 1 }}>
            Desejos
          </div>
          <div onClick={onStats} className="press" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', cursor: 'pointer' }}>
            <div style={{ fontFamily: display, fontSize: 18, fontWeight: 600, color: '#0a0a0a', lineHeight: 1 }}>
              {formatPrice(totalWanted)}
            </div>
            <div style={{ fontSize: 11, color: '#9a9a9a', marginTop: 3 }}>{items.length} itens</div>
          </div>
        </div>

        {/* filtros de status */}
        <div style={{ display: 'flex', gap: 20, marginTop: 18, borderBottom: '1px solid #f0f0f0' }}>
          {tabs.map((tb) => {
            const on = filter === tb.key
            return (
              <button
                key={tb.key}
                onClick={() => setFilter(tb.key)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0 0 10px',
                  fontFamily: 'var(--font-body)',
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: on ? '#0a0a0a' : '#9a9a9a',
                  borderBottom: `2px solid ${on ? '#0a0a0a' : 'transparent'}`,
                  marginBottom: -1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'color .2s',
                }}
              >
                <span>{tb.label}</span>
                <span style={{ fontFamily: display, fontSize: 11, fontWeight: 600, color: on ? '#0a0a0a' : '#c4c4c4' }}>
                  {tb.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* toggle Lista / Galeria */}
        <div style={{ position: 'relative', display: 'flex', background: '#f4f4f4', borderRadius: 13, padding: 4, marginTop: 20 }}>
          <div
            style={{
              position: 'absolute',
              top: 4,
              bottom: 4,
              left: 4,
              width: 'calc(50% - 4px)',
              background: '#ffffff',
              borderRadius: 10,
              boxShadow: '0 1px 3px rgba(0,0,0,.10)',
              transition: 'transform .28s cubic-bezier(.4,0,.1,1)',
              transform: `translateX(${isEditorial ? '0%' : '100%'})`,
            }}
          />
          <button
            onClick={() => setLayout('editorial')}
            style={{ flex: 1, zIndex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '9px 0', fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600, transition: 'color .2s', color: isEditorial ? '#0a0a0a' : '#9a9a9a' }}
          >
            Lista
          </button>
          <button
            onClick={() => setLayout('gallery')}
            style={{ flex: 1, zIndex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '9px 0', fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600, transition: 'color .2s', color: isEditorial ? '#9a9a9a' : '#0a0a0a' }}
          >
            Galeria
          </button>
        </div>
      </div>

      <div data-scroll style={{ flex: 1, overflow: 'auto', marginTop: 14 }}>
        {visible.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '64px 22px' }}>
            <span style={{ fontFamily: display, fontSize: 16, fontWeight: 600, color: '#0a0a0a' }}>Nada por aqui ainda</span>
            <span style={{ fontSize: 13, color: '#9a9a9a' }}>Toque em + para adicionar um desejo</span>
          </div>
        ) : isEditorial ? (
          <EditorialList items={visible} onOpen={onOpen} />
        ) : (
          <GalleryGrid items={visible} onOpen={onOpen} />
        )}
      </div>

      <TabBar active="home" onHome={() => {}} onStats={onStats} onNew={onNew} />
    </>
  )
}

function PriorityBar({ priority, width = 26 }: { priority: WishItem['priority']; width?: number }) {
  return (
    <div style={{ width, height: 3, borderRadius: 2, background: '#ececec', overflow: 'hidden' }}>
      <div style={{ height: '100%', background: '#0a0a0a', borderRadius: 2, width: PRIORITY_META[priority].pct }} />
    </div>
  )
}

function EditorialList({ items, onOpen }: { items: WishItem[]; onOpen: (id: string) => void }) {
  return (
    <div style={{ paddingBottom: 24 }}>
      {items.map((it, idx) => {
        const bought = it.status === 'bought'
        return (
          <div
            key={it.id}
            onClick={() => onOpen(it.id)}
            className="press-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '13px 22px',
              borderBottom: '1px solid #f0f0f0',
              cursor: 'pointer',
              animation: 'rowIn .42s both',
              animationDelay: `${idx * 0.035}s`,
            }}
          >
            <div style={{ position: 'relative', width: 52, height: 52, borderRadius: 13, background: '#f4f4f4', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {it.photo ? (
                <img src={it.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: bought ? 0.5 : 1 }} />
              ) : (
                <span style={{ fontFamily: display, fontSize: 24, fontWeight: 600, color: '#d6d6d6', opacity: bought ? 0.4 : 1 }}>{initialOf(it.name)}</span>
              )}
              {bought && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckIcon />
                  </div>
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: display, fontSize: 15.5, fontWeight: 600, color: bought ? '#b0b0b0' : '#0a0a0a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: bought ? 'line-through' : 'none' }}>
                {it.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 3 }}>
                <span style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: '.04em', color: '#a8a8a8', textTransform: 'uppercase' }}>{primaryCategory(it)}</span>
                {bought && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: mono, fontSize: 8.5, letterSpacing: '.04em', textTransform: 'uppercase', color: it.receipt ? '#6b6b6b' : '#b0b0b0', whiteSpace: 'nowrap' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: it.receipt ? '#0a0a0a' : '#d2d2d2' }} />
                    {it.receipt ? 'NF arquivada' : 'sem NF'}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7, flexShrink: 0 }}>
              <div style={{ fontFamily: display, fontSize: 14.5, fontWeight: 600, color: bought ? '#bdbdbd' : '#0a0a0a' }}>{formatPrice(it.priceCents)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '.06em', color: '#bdbdbd', textTransform: 'uppercase' }}>{PRIORITY_META[it.priority].label}</span>
                <PriorityBar priority={it.priority} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function GalleryGrid({ items, onOpen }: { items: WishItem[]; onOpen: (id: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '6px 22px 24px' }}>
      {items.map((it, idx) => {
        const bought = it.status === 'bought'
        return (
          <div key={it.id} onClick={() => onOpen(it.id)} className="press" style={{ cursor: 'pointer', animation: 'rowIn .42s both', animationDelay: `${idx * 0.04}s` }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: 18, background: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {it.photo ? (
                <img src={it.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: bought ? 0.5 : 1 }} />
              ) : (
                <span style={{ fontFamily: display, fontSize: 48, fontWeight: 600, color: '#dadada', opacity: bought ? 0.4 : 1 }}>{initialOf(it.name)}</span>
              )}
              <span style={{ position: 'absolute', left: 11, bottom: 10, fontFamily: mono, fontSize: 8, letterSpacing: '.06em', color: '#b0b0b0', textTransform: 'uppercase' }}>{primaryCategory(it)}</span>
              {bought && (
                <div style={{ position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: '50%', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckIcon size={12} />
                </div>
              )}
            </div>
            <div style={{ marginTop: 9, fontFamily: display, fontSize: 13.5, fontWeight: 600, color: bought ? '#b0b0b0' : '#0a0a0a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: bought ? 'line-through' : 'none' }}>
              {it.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontFamily: display, fontSize: 13, fontWeight: 600, color: bought ? '#bdbdbd' : '#0a0a0a' }}>{formatPrice(it.priceCents)}</span>
              <PriorityBar priority={it.priority} width={24} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
