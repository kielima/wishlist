import { PRIORITY_META } from '../constants'
import { formatPrice, initialOf, linkDomain, linkHref, primaryCategory } from '../format'
import type { WishItem } from '../types'
import { BackIcon, CheckIcon, CloseIcon, DocIcon, ExternalIcon, TrashIcon } from '../components/Icons'

interface Props {
  item: WishItem
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleBought: () => void
  onAttachReceipt: (file: File) => void
  onRemoveReceipt: () => void
}

const mono = 'var(--font-mono)'
const display = 'var(--font-display)'
const TOP_PAD = 'calc(env(safe-area-inset-top) + 26px)'

const sectionLabel: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 10,
  letterSpacing: '.12em',
  color: '#a3a3a3',
  textTransform: 'uppercase',
}

export default function Detail({ item, onBack, onEdit, onDelete, onToggleBought, onAttachReceipt, onRemoveReceipt }: Props) {
  const bought = item.status === 'bought'
  const pri = PRIORITY_META[item.priority]
  const tick = (idx: number) => (idx < pri.ticks ? '#0a0a0a' : '#ececec')

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#ffffff', animation: 'screenIn .32s cubic-bezier(.2,.7,.2,1) both' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${TOP_PAD} 18px 6px` }}>
        <button onClick={onBack} className="press-lg" style={{ background: '#f4f4f4', border: 'none', cursor: 'pointer', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BackIcon />
        </button>
        <button onClick={onEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: '#0a0a0a', padding: '8px 12px' }}>
          Editar
        </button>
      </div>

      <div data-scroll style={{ flex: 1, overflow: 'auto', padding: '8px 22px 20px' }}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '1.15', borderRadius: 22, background: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {item.photo ? (
            <img src={item.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: bought ? 0.55 : 1 }} />
          ) : (
            <span style={{ fontFamily: display, fontSize: 96, fontWeight: 600, color: '#dcdcdc', opacity: bought ? 0.4 : 1 }}>{initialOf(item.name)}</span>
          )}
          {bought && (
            <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 7, background: '#0a0a0a', borderRadius: 999, padding: '7px 13px' }}>
              <CheckIcon size={12} />
              <span style={{ color: '#fff', fontSize: 11, fontWeight: 600, fontFamily: display, letterSpacing: '.02em' }}>Comprado</span>
            </div>
          )}
        </div>

        <div style={{ marginTop: 22, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ fontFamily: display, fontSize: 25, fontWeight: 700, color: '#0a0a0a', letterSpacing: '-.01em', lineHeight: 1.15, flex: 1 }}>{item.name}</div>
          <div style={{ fontFamily: display, fontSize: 22, fontWeight: 600, color: '#0a0a0a', whiteSpace: 'nowrap' }}>{formatPrice(item.priceCents)}</div>
        </div>

        {/* medidor de prioridade */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={sectionLabel}>Prioridade</span>
            <span style={{ fontFamily: display, fontSize: 12, fontWeight: 600, color: '#0a0a0a' }}>{pri.full}</span>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: tick(i) }} />
            ))}
          </div>
        </div>

        {/* categorias */}
        <div style={{ marginTop: 22, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(item.categories.length ? item.categories : [primaryCategory(item)]).map((c) => (
            <div key={c} style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: '.04em', color: '#555', background: '#f4f4f4', borderRadius: 999, padding: '7px 13px', textTransform: 'uppercase' }}>
              {c}
            </div>
          ))}
        </div>

        {/* nota fiscal (itens comprados) */}
        {bought && (
          <div style={{ marginTop: 24 }}>
            <div style={{ ...sectionLabel, marginBottom: 10 }}>Nota fiscal</div>
            {item.receipt ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #ececec', borderRadius: 14, padding: '12px 13px', animation: 'popIn .3s ease both' }}>
                {item.receipt.kind === 'image' ? (
                  <img src={item.receipt.dataUrl} alt="Nota fiscal" style={{ width: 44, height: 52, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: '#f4f4f4' }} />
                ) : (
                  <div style={{ width: 44, height: 52, borderRadius: 8, background: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <DocIcon />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: display, fontSize: 13.5, fontWeight: 600, color: '#0a0a0a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.receipt.name}</div>
                  <div style={{ fontSize: 11.5, color: '#9a9a9a', marginTop: 3 }}>Arquivada em {item.receipt.date}</div>
                </div>
                <a href={item.receipt.dataUrl} target="_blank" rel="noreferrer" className="press" style={{ textDecoration: 'none', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, color: '#0a0a0a', background: '#f4f4f4', borderRadius: 9, padding: '8px 12px', flexShrink: 0 }}>
                  Ver
                </a>
                <button onClick={onRemoveReceipt} className="press-md" style={{ background: 'none', border: 'none', cursor: 'pointer', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CloseIcon />
                </button>
              </div>
            ) : (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', boxSizing: 'border-box', border: '1.5px dashed #dcdcdc', borderRadius: 14, padding: 22, cursor: 'pointer' }}>
                <DocIcon w={22} h={26} color="#bdbdbd" />
                <span style={{ fontFamily: display, fontSize: 13.5, fontWeight: 600, color: '#0a0a0a' }}>Anexar nota fiscal</span>
                <span style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: '.05em', color: '#b0b0b0', textTransform: 'uppercase' }}>Foto ou PDF · fica arquivada aqui</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) onAttachReceipt(f)
                    e.target.value = ''
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
        )}

        {/* descrição */}
        <div style={{ marginTop: 24 }}>
          <div style={{ ...sectionLabel, marginBottom: 8 }}>Descrição</div>
          <div style={{ fontSize: 15, lineHeight: 1.6, color: '#3a3a3a', whiteSpace: 'pre-wrap' }}>{item.description || 'Sem descrição ainda.'}</div>
        </div>

        {/* link */}
        {item.link && (
          <a href={linkHref(item.link)} target="_blank" rel="noreferrer" className="press-row" style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', border: '1px solid #ececec', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.1em', color: '#a3a3a3', textTransform: 'uppercase' }}>Onde comprar</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0a' }}>{linkDomain(item.link)}</span>
            </div>
            <ExternalIcon />
          </a>
        )}
      </div>

      {/* ações */}
      <div style={{ padding: '12px 22px calc(28px + env(safe-area-inset-bottom))', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 12 }}>
        <button onClick={onDelete} className="press-md" style={{ background: '#f4f4f4', border: 'none', cursor: 'pointer', width: 54, borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TrashIcon />
        </button>
        <button
          onClick={onToggleBought}
          className="press"
          style={{
            flex: 1,
            cursor: 'pointer',
            borderRadius: 15,
            padding: 16,
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            fontWeight: 600,
            background: bought ? '#ffffff' : '#0a0a0a',
            color: bought ? '#0a0a0a' : '#ffffff',
            border: bought ? '1.5px solid #e2e2e2' : '1.5px solid #0a0a0a',
          }}
        >
          {bought ? 'Marcar como desejado' : 'Marcar como comprado'}
        </button>
      </div>
    </div>
  )
}
