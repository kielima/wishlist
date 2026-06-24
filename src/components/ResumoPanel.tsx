import { PRIORITIES } from '../constants'
import { formatPrice, primaryCategory } from '../format'
import { useCountUp } from '../useCountUp'
import type { WishItem } from '../types'
import { CloseIcon } from './Icons'
import PriorityTicks from './PriorityTicks'

interface Props {
  items: WishItem[]
  open: boolean
  /** No layout largo o painel fica fixo (sem sombra/backdrop). */
  inline: boolean
  isNarrow: boolean
  onClose: () => void
  onSignOut?: () => void
}

const display = 'var(--font-display)'
const mono = 'var(--font-mono)'
const label: React.CSSProperties = { fontFamily: mono, fontSize: 9.5, letterSpacing: '.12em', color: '#a3a3a3', textTransform: 'uppercase' }

export default function ResumoPanel({ items, open, inline, isNarrow, onClose, onSignOut }: Props) {
  const t = useCountUp(open)

  const wanted = items.filter((i) => i.status === 'wanted')
  const bought = items.filter((i) => i.status === 'bought')
  const totalWanted = wanted.reduce((s, i) => s + (i.priceCents ?? 0), 0)
  const spent = bought.reduce((s, i) => s + (i.priceCents ?? 0), 0)
  const progress = items.length ? (bought.length / items.length) * 100 * t : 0

  const catMap: Record<string, number> = {}
  wanted.forEach((i) => {
    const c = primaryCategory(i)
    catMap[c] = (catMap[c] ?? 0) + (i.priceCents ?? 0)
  })
  const catArr = Object.entries(catMap).sort((a, b) => b[1] - a[1])
  const catMax = catArr.length ? catArr[0][1] : 1

  const priBreakdown = PRIORITIES.map((p) => {
    const list = wanted.filter((i) => i.priority === p.value)
    return { meta: p, count: list.length, cents: list.reduce((s, i) => s + (i.priceCents ?? 0), 0) }
  })

  return (
    <aside
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: isNarrow ? '100%' : 362,
        maxWidth: '100%',
        background: '#fff',
        borderLeft: '1px solid #f0f0f0',
        zIndex: 41,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: inline ? 'none' : '-12px 0 40px rgba(0,0,0,.12)',
        transition: 'transform .34s cubic-bezier(.3,.7,.2,1)',
        transform: open ? 'translateX(0%)' : 'translateX(100%)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 24px 0' }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.16em', color: '#bdbdbd' }}>RESUMO</div>
          <div style={{ fontFamily: display, fontSize: 22, fontWeight: 700, lineHeight: 1, marginTop: 3 }}>Panorama</div>
        </div>
        <button onClick={onClose} className="soft-hover" style={{ background: '#f4f4f4', border: 'none', cursor: 'pointer', width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CloseIcon size={13} color="#6b6b6b" />
        </button>
      </div>

      <div data-scroll style={{ flex: 1, overflow: 'auto', padding: '22px 24px 28px' }}>
        <div style={label}>Total a conquistar</div>
        <div style={{ fontFamily: display, fontSize: 42, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1.05, marginTop: 4 }}>{formatPrice(Math.round(totalWanted * t))}</div>
        <div style={{ fontSize: 13, color: '#9a9a9a', marginTop: 3 }}>{wanted.length} itens dos sonhos restantes</div>

        <div style={{ marginTop: 22, border: '1px solid #ececec', borderRadius: 16, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: display, fontSize: 24, fontWeight: 700, lineHeight: 1 }}>
                {bought.length}
                <span style={{ color: '#c4c4c4', fontSize: 17 }}>/{items.length}</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#9a9a9a', marginTop: 3 }}>já conquistados</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '.1em', color: '#a3a3a3', textTransform: 'uppercase' }}>Já investido</div>
              <div style={{ fontFamily: display, fontSize: 16, fontWeight: 600, marginTop: 3 }}>{formatPrice(Math.round(spent * t))}</div>
            </div>
          </div>
          <div style={{ marginTop: 13, height: 6, borderRadius: 4, background: '#f0f0f0', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#0a0a0a', borderRadius: 4, width: `${progress.toFixed(1)}%` }} />
          </div>
        </div>

        <div style={{ ...label, marginTop: 24, marginBottom: 13 }}>Por categoria</div>
        {catArr.length === 0 ? (
          <div style={{ fontSize: 13, color: '#bdbdbd' }}>Sem itens desejados.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {catArr.map(([name, cents]) => (
              <div key={name}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{name}</span>
                  <span style={{ fontFamily: display, fontSize: 12.5, fontWeight: 600, color: '#6b6b6b' }}>{formatPrice(Math.round(cents * t))}</span>
                </div>
                <div style={{ height: 6, borderRadius: 4, background: '#f2f2f2', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#0a0a0a', borderRadius: 4, width: `${((cents / catMax) * 100 * t).toFixed(1)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ ...label, marginTop: 26, marginBottom: 8 }}>Por prioridade</div>
        {priBreakdown.map(({ meta, count, cents }) => (
          <div key={meta.value} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid #f4f4f4' }}>
            <PriorityTicks priority={meta.value} w={5} h={13} gap={2.5} />
            <span style={{ flex: 1, fontFamily: display, fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{meta.full}</span>
            <span style={{ fontSize: 11.5, color: '#9a9a9a' }}>{count}</span>
            <span style={{ fontFamily: display, fontSize: 12.5, fontWeight: 600, width: 72, textAlign: 'right' }}>{formatPrice(Math.round(cents * t))}</span>
          </div>
        ))}

        {onSignOut && (
          <button onClick={onSignOut} style={{ marginTop: 28, width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#bdbdbd', padding: 8 }}>
            Sair da conta
          </button>
        )}
      </div>
    </aside>
  )
}
