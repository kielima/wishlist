import { PRIORITY_META } from '../constants'
import { formatPrice, initialOf, primaryCategory } from '../format'
import { toBRLCents, useRates } from '../currency'
import type { WishItem } from '../types'
import { CheckIcon } from './Icons'
import PriorityTicks from './PriorityTicks'

const display = 'var(--font-display)'
const mono = 'var(--font-mono)'

function Thumb({ item, size, font, radius }: { item: WishItem; size: number; font: number; radius: number }) {
  const bought = item.status === 'bought'
  return (
    <div style={{ position: 'relative', width: size, height: size, borderRadius: radius, background: '#f4f4f4', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {item.photo ? (
        <img src={item.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: bought ? 0.5 : 1 }} />
      ) : (
        <span style={{ fontFamily: display, fontSize: font, fontWeight: 600, color: '#d6d6d6', opacity: bought ? 0.4 : 1 }}>{initialOf(item.name)}</span>
      )}
      {bought && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckIcon size={10} />
          </div>
        </div>
      )}
    </div>
  )
}

function nf(item: WishItem) {
  return {
    text: item.receipt ? 'NF arquivada' : 'sem NF',
    dot: item.receipt ? '#0a0a0a' : '#d2d2d2',
    color: item.receipt ? '#6b6b6b' : '#b0b0b0',
  }
}

/** Tabela densa (desktop, modo Lista). */
export function ItemTable({ items, width, onOpen }: { items: WishItem[]; width: number; onOpen: (id: string) => void }) {
  const rates = useRates()
  const colTemplate =
    width < 980
      ? 'minmax(0,2.4fr) minmax(0,1fr) minmax(0,1.1fr) minmax(0,0.8fr)'
      : 'minmax(0,2.6fr) minmax(0,1.2fr) minmax(0,1fr) minmax(0,0.8fr)'
  const head: React.CSSProperties = { fontFamily: mono, fontSize: 9.5, letterSpacing: '.1em', color: '#bdbdbd', textTransform: 'uppercase' }

  return (
    <div style={{ padding: '8px 28px 40px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: colTemplate, gap: 18, padding: '12px 14px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={head}>Item</div>
        <div style={head}>Categoria</div>
        <div style={head}>Prioridade</div>
        <div style={{ ...head, textAlign: 'right' }}>Preço</div>
      </div>
      {items.map((it, idx) => {
        const bought = it.status === 'bought'
        const r = nf(it)
        return (
          <div
            key={it.id}
            onClick={() => onOpen(it.id)}
            className="row-hover"
            style={{ display: 'grid', gridTemplateColumns: colTemplate, gap: 18, alignItems: 'center', padding: '13px 14px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', borderRadius: 10, animation: 'rowIn .4s both', animationDelay: `${idx * 0.03}s` }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, minWidth: 0 }}>
              <Thumb item={it} size={44} font={20} radius={11} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: display, fontSize: 14.5, fontWeight: 600, color: bought ? '#b0b0b0' : '#0a0a0a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: bought ? 'line-through' : 'none' }}>{it.name}</div>
                {bought && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: r.dot }} />
                    <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '.04em', textTransform: 'uppercase', color: r.color }}>{r.text}</span>
                  </div>
                )}
              </div>
            </div>
            <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '.03em', color: '#9a9a9a', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{primaryCategory(it)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.05em', color: '#bdbdbd', textTransform: 'uppercase', width: 42 }}>{PRIORITY_META[it.priority].label}</span>
              <PriorityTicks priority={it.priority} w={6} h={12} />
            </div>
            <div style={{ fontFamily: display, fontSize: 14.5, fontWeight: 600, color: bought ? '#bdbdbd' : '#0a0a0a', textAlign: 'right' }}>{formatPrice(toBRLCents(it.priceCents, it.currency, rates))}</div>
          </div>
        )
      })}
    </div>
  )
}

/** Lista compacta (mobile, modo Lista). */
export function CompactList({ items, onOpen }: { items: WishItem[]; onOpen: (id: string) => void }) {
  const rates = useRates()
  return (
    <div style={{ padding: '6px 0 32px' }}>
      {items.map((it, idx) => {
        const bought = it.status === 'bought'
        const r = nf(it)
        return (
          <div
            key={it.id}
            onClick={() => onOpen(it.id)}
            className="row-hover"
            style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 18px', borderBottom: '1px solid #f3f3f3', cursor: 'pointer', animation: 'rowIn .4s both', animationDelay: `${idx * 0.03}s` }}
          >
            <Thumb item={it} size={46} font={21} radius={12} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: display, fontSize: 15, fontWeight: 600, color: bought ? '#b0b0b0' : '#0a0a0a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: bought ? 'line-through' : 'none' }}>{it.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                <span style={{ fontFamily: mono, fontSize: 10, color: '#a8a8a8', textTransform: 'uppercase' }}>{primaryCategory(it)}</span>
                {bought && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: mono, fontSize: 8.5, textTransform: 'uppercase', color: r.color }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: r.dot }} />
                    {r.text}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <span style={{ fontFamily: display, fontSize: 14, fontWeight: 600, color: bought ? '#bdbdbd' : '#0a0a0a' }}>{formatPrice(toBRLCents(it.priceCents, it.currency, rates))}</span>
              <PriorityTicks priority={it.priority} w={5} h={10} gap={2.5} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Grade de galeria (qualquer largura). */
export function GalleryGrid({ items, isNarrow, onOpen }: { items: WishItem[]; isNarrow: boolean; onOpen: (id: string) => void }) {
  const rates = useRates()
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isNarrow ? '150px' : '190px'}, 1fr))`, gap: 20, padding: '22px 28px 40px' }}>
      {items.map((it, idx) => {
        const bought = it.status === 'bought'
        return (
          <div key={it.id} onClick={() => onOpen(it.id)} className="gal-hover" style={{ cursor: 'pointer', animation: 'rowIn .42s both', animationDelay: `${idx * 0.03}s` }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: 18, background: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {it.photo ? (
                <img src={it.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: bought ? 0.5 : 1 }} />
              ) : (
                <span style={{ fontFamily: display, fontSize: 52, fontWeight: 600, color: '#dadada', opacity: bought ? 0.4 : 1 }}>{initialOf(it.name)}</span>
              )}
              <span style={{ position: 'absolute', left: 12, bottom: 11, fontFamily: mono, fontSize: 8, letterSpacing: '.05em', color: '#b0b0b0', textTransform: 'uppercase' }}>{primaryCategory(it)}</span>
              {bought && (
                <div style={{ position: 'absolute', top: 11, right: 11, display: 'flex', alignItems: 'center', gap: 5, background: '#0a0a0a', borderRadius: 999, padding: '4px 9px 4px 7px' }}>
                  <CheckIcon size={10} stroke={1.8} />
                  <span style={{ fontFamily: mono, fontSize: 7.5, letterSpacing: '.04em', color: '#fff', textTransform: 'uppercase' }}>{it.receipt ? 'NF' : 'S/ NF'}</span>
                </div>
              )}
            </div>
            <div style={{ marginTop: 11, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontFamily: display, fontSize: 14.5, fontWeight: 600, color: bought ? '#b0b0b0' : '#0a0a0a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: bought ? 'line-through' : 'none' }}>{it.name}</span>
              <span style={{ fontFamily: display, fontSize: 14, fontWeight: 600, color: bought ? '#bdbdbd' : '#0a0a0a', flexShrink: 0 }}>{formatPrice(toBRLCents(it.priceCents, it.currency, rates))}</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <PriorityTicks priority={it.priority} w="flex" h={3} gap={3} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
