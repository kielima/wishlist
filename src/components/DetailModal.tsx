import { PRIORITY_META } from '../constants'
import { formatPrice, initialOf, linkDomain, linkHref, primaryCategory } from '../format'
import { formatMoney, toBRLCents, useRates } from '../currency'
import type { Viewport } from '../useViewport'
import type { WishItem } from '../types'
import { CheckIcon, CloseIcon, DocIcon, ExternalIcon, HeartIcon, TrashIcon } from './Icons'

interface Props {
  item: WishItem
  vp: Viewport
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleBought: () => void
  onToggleFav: () => void
  onAttachReceipt: (file: File) => void
  onRemoveReceipt: () => void
}

const display = 'var(--font-display)'
const mono = 'var(--font-mono)'
const label: React.CSSProperties = { fontFamily: mono, fontSize: 9.5, letterSpacing: '.12em', color: '#a3a3a3', textTransform: 'uppercase' }

export default function DetailModal({ item, vp, onClose, onEdit, onDelete, onToggleBought, onToggleFav, onAttachReceipt, onRemoveReceipt }: Props) {
  const { isNarrow, width } = vp
  const rates = useRates()
  const bought = item.status === 'bought'
  const pri = PRIORITY_META[item.priority]
  const tick = (i: number) => (i < pri.ticks ? '#0a0a0a' : '#ececec')

  const detailWidth = isNarrow ? '100%' : width < 1100 ? 640 : 740
  const visualW = isNarrow ? '100%' : width < 1100 ? 244 : 300
  const visualH = isNarrow ? 180 : 'auto'

  return (
    <Overlay isNarrow={isNarrow} onClose={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: isNarrow ? 0 : 22, width: detailWidth, maxWidth: '100%', height: isNarrow ? '100%' : 'auto', maxHeight: '100%', overflow: 'hidden', display: 'flex', flexDirection: isNarrow ? 'column' : 'row', boxShadow: '0 24px 70px rgba(0,0,0,.3)', animation: 'modalIn .3s cubic-bezier(.2,.7,.2,1) both' }}
      >
        {/* visual */}
        <div style={{ position: 'relative', background: '#f4f4f4', flexShrink: 0, width: visualW, height: visualH, minHeight: isNarrow ? 180 : 320, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {item.photo ? (
            <img src={item.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: bought ? 0.55 : 1 }} />
          ) : (
            <span style={{ fontFamily: display, fontSize: 96, fontWeight: 600, color: '#dcdcdc', opacity: bought ? 0.4 : 1 }}>{initialOf(item.name)}</span>
          )}
          {bought && (
            <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 7, background: '#0a0a0a', borderRadius: 999, padding: '7px 13px' }}>
              <CheckIcon size={12} />
              <span style={{ color: '#fff', fontSize: 11, fontWeight: 600, fontFamily: display }}>Comprado</span>
            </div>
          )}
        </div>

        {/* info */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '16px 18px 0' }}>
            <button onClick={onToggleFav} className="press" style={{ marginRight: 'auto', background: '#f4f4f4', border: 'none', cursor: 'pointer', width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label={item.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}>
              <HeartIcon size={17} filled={!!item.favorite} />
            </button>
            <button onClick={onEdit} className="soft-hover" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#0a0a0a', padding: '7px 11px', borderRadius: 9 }}>Editar</button>
            <button onClick={onClose} style={{ background: '#f4f4f4', border: 'none', cursor: 'pointer', width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CloseIcon size={12} color="#6b6b6b" />
            </button>
          </div>

          <div data-scroll style={{ flex: 1, overflow: 'auto', padding: '6px 26px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ fontFamily: display, fontSize: 24, fontWeight: 700, letterSpacing: '-.01em', lineHeight: 1.15 }}>{item.name}</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: display, fontSize: 22, fontWeight: 600, whiteSpace: 'nowrap' }}>{formatPrice(toBRLCents(item.priceCents, item.currency, rates))}</div>
                {item.currency !== 'BRL' && item.priceCents != null && (
                  <div style={{ fontFamily: mono, fontSize: 10.5, color: '#a3a3a3', marginTop: 3, whiteSpace: 'nowrap' }}>{formatMoney(item.priceCents, item.currency)}</div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={label}>Prioridade</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{pri.full}</span>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: tick(i) }} />
                ))}
              </div>
            </div>

            <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(item.categories.length ? item.categories : [primaryCategory(item)]).map((c) => (
                <div key={c} style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: '.04em', color: '#555', background: '#f4f4f4', borderRadius: 999, padding: '7px 13px', textTransform: 'uppercase' }}>{c}</div>
              ))}
            </div>

            {bought && (
              <div style={{ marginTop: 22 }}>
                <div style={{ ...label, marginBottom: 10 }}>Nota fiscal</div>
                {item.receipt ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #ececec', borderRadius: 13, padding: '11px 13px', animation: 'fadeIn .3s ease both' }}>
                    {item.receipt.kind === 'image' ? (
                      <div style={{ width: 42, height: 50, borderRadius: 8, flexShrink: 0, backgroundColor: '#f4f4f4', backgroundImage: `url("${item.receipt.dataUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    ) : (
                      <div style={{ width: 42, height: 50, borderRadius: 8, background: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <DocIcon w={19} h={23} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: display, fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.receipt.name}</div>
                      <div style={{ fontSize: 11.5, color: '#9a9a9a', marginTop: 3 }}>Arquivada em {item.receipt.date}</div>
                    </div>
                    <a href={item.receipt.dataUrl} target="_blank" rel="noreferrer" className="soft-hover" style={{ textDecoration: 'none', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, color: '#0a0a0a', background: '#f4f4f4', borderRadius: 9, padding: '8px 12px', flexShrink: 0 }}>Ver</a>
                    <button onClick={onRemoveReceipt} style={{ background: 'none', border: 'none', cursor: 'pointer', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CloseIcon size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="soft-hover" style={{ display: 'flex', alignItems: 'center', gap: 13, width: '100%', border: '1.5px dashed #dcdcdc', borderRadius: 13, padding: '15px 16px', cursor: 'pointer' }}>
                    <DocIcon w={20} h={24} color="#bdbdbd" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: display, fontSize: 13.5, fontWeight: 600 }}>Anexar nota fiscal</div>
                      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '.04em', color: '#b0b0b0', textTransform: 'uppercase', marginTop: 2 }}>Foto ou PDF · fica arquivada aqui</div>
                    </div>
                    <input type="file" accept="image/*,application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) onAttachReceipt(f); e.target.value = '' }} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
            )}

            <div style={{ marginTop: 22 }}>
              <div style={{ ...label, marginBottom: 8 }}>Descrição</div>
              <div style={{ fontSize: 14.5, lineHeight: 1.6, color: '#3a3a3a', whiteSpace: 'pre-wrap' }}>{item.description || 'Sem descrição ainda.'}</div>
            </div>

            {item.link && (
              <a href={linkHref(item.link)} target="_blank" rel="noreferrer" className="soft-hover" style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', border: '1px solid #ececec', borderRadius: 13, padding: '13px 15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '.1em', color: '#a3a3a3', textTransform: 'uppercase' }}>Onde comprar</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{linkDomain(item.link)}</span>
                </div>
                <ExternalIcon />
              </a>
            )}
          </div>

          <div style={{ padding: '12px 26px 20px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 11 }}>
            <button onClick={onDelete} className="soft-hover" style={{ background: '#f4f4f4', border: 'none', cursor: 'pointer', width: 50, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrashIcon />
            </button>
            <button onClick={onToggleBought} className="press" style={{ flex: 1, border: 'none', cursor: 'pointer', borderRadius: 13, padding: 14, fontFamily: 'var(--font-body)', fontSize: 14.5, fontWeight: 600, background: bought ? '#fff' : '#0a0a0a', color: bought ? '#0a0a0a' : '#fff', borderWidth: 1.5, borderStyle: 'solid', borderColor: bought ? '#e2e2e2' : '#0a0a0a' }}>
              {bought ? 'Marcar como desejado' : 'Marcar como comprado'}
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  )
}

/** Fundo escuro que centraliza o modal. Clique fora fecha. */
export function Overlay({ isNarrow, onClose, children }: { isNarrow: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,10,.4)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isNarrow ? 0 : 32, animation: 'fadeIn .2s ease' }}>
      {children}
    </div>
  )
}
