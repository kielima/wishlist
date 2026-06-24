import { useState } from 'react'
import { CATEGORIES, PRIORITIES, STATUSES } from '../constants'
import { fileToDataUrl } from '../format'
import { CURRENCIES, CURRENCY_META } from '../currency'
import type { Viewport } from '../useViewport'
import type { Currency, Priority, Status, WishItem, WishItemInput } from '../types'
import { CameraIcon } from './Icons'
import { Overlay } from './DetailModal'

interface Props {
  item?: WishItem
  /** Valores iniciais ao criar um desejo via webclipper. */
  prefill?: { name?: string; priceReais?: string; link?: string; photo?: string; photos?: string[] }
  vp: Viewport
  onClose: () => void
  onSave: (input: WishItemInput) => void
}

const display = 'var(--font-display)'
const mono = 'var(--font-mono)'

const fieldLabel: React.CSSProperties = { fontFamily: mono, fontSize: 9.5, letterSpacing: '.1em', color: '#a3a3a3', textTransform: 'uppercase', marginBottom: 8 }
const underline: React.CSSProperties = { width: '100%', border: 'none', borderBottom: '1.5px solid #ececec', background: 'none', padding: '8px 0', color: '#0a0a0a', outline: 'none' }

export default function EditModal({ item, prefill, vp, onClose, onSave }: Props) {
  const { isNarrow, width } = vp
  const [name, setName] = useState(item?.name ?? prefill?.name ?? '')
  const [priceReais, setPriceReais] = useState(
    item?.priceCents != null ? String(Math.round(item.priceCents / 100)) : (prefill?.priceReais ?? ''),
  )
  const [currency, setCurrency] = useState<Currency>(item?.currency ?? 'BRL')
  const [link, setLink] = useState(item?.link ?? prefill?.link ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [priority, setPriority] = useState<Priority>(item?.priority ?? 'should')
  const [categories, setCategories] = useState<string[]>(item?.categories ?? [])
  const [status, setStatus] = useState<Status>(item?.status ?? 'wanted')
  const [photo, setPhoto] = useState<string | null>(item?.photo ?? prefill?.photo ?? null)
  const [error, setError] = useState(false)

  const editWidth = isNarrow ? '100%' : width < 920 ? 560 : 720
  const editGrid = width < 720 ? '1fr' : '200px 1fr'

  function cycleCurrency() {
    const i = CURRENCIES.findIndex((c) => c.code === currency)
    setCurrency(CURRENCIES[(i + 1) % CURRENCIES.length].code)
  }

  function toggleCat(c: string) {
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }

  function save() {
    if (!name.trim()) {
      setError(true)
      return
    }
    onSave({
      name: name.trim(),
      description: description.trim(),
      link: link.trim(),
      priceCents: priceReais ? (parseInt(priceReais, 10) || 0) * 100 : null,
      currency,
      priority,
      status,
      categories,
      photo,
      receipt: item?.receipt ?? null,
    })
  }

  return (
    <Overlay isNarrow={isNarrow} onClose={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: isNarrow ? 0 : 22, width: editWidth, maxWidth: '100%', height: isNarrow ? '100%' : 'auto', maxHeight: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 70px rgba(0,0,0,.3)', animation: 'modalIn .3s cubic-bezier(.2,.7,.2,1) both' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ fontFamily: display, fontSize: 18, fontWeight: 700 }}>{item ? 'Editar desejo' : 'Novo desejo'}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} className="soft-hover" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, color: '#9a9a9a', padding: '9px 12px', borderRadius: 9 }}>Cancelar</button>
            <button onClick={save} className="press" style={{ background: '#0a0a0a', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#fff', padding: '9px 18px', borderRadius: 10 }}>Salvar</button>
          </div>
        </div>

        <div data-scroll style={{ flex: 1, overflow: 'auto', padding: '22px 24px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: editGrid, gap: 22 }}>
            {/* coluna esquerda: foto + status */}
            <div>
              <label style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', aspectRatio: '1.5', borderRadius: 15, background: photo ? '#000' : '#fafafa', border: photo ? 'none' : '1.5px dashed #dcdcdc', cursor: 'pointer', overflow: 'hidden' }}>
                {photo ? (
                  <img src={photo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <>
                    <CameraIcon />
                    <span style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: '.06em', color: '#b0b0b0', textTransform: 'uppercase' }}>Adicionar foto</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPhoto(await fileToDataUrl(f)); e.target.value = '' }} style={{ display: 'none' }} />
              </label>

              {prefill?.photos && prefill.photos.length > 1 && (
                <div style={{ marginTop: 12 }}>
                  <div style={fieldLabel}>Escolher imagem</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {prefill.photos.map((url) => {
                      const active = photo === url
                      return (
                        <button
                          key={url}
                          onClick={() => setPhoto(url)}
                          title="Usar esta imagem"
                          style={{ width: 52, height: 52, borderRadius: 10, padding: 0, cursor: 'pointer', overflow: 'hidden', background: '#f4f4f4', border: active ? '2px solid #0a0a0a' : '1.5px solid #ececec' }}
                        >
                          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 18 }}>
                <div style={fieldLabel}>Status</div>
                <div style={{ display: 'flex', gap: 9 }}>
                  {STATUSES.map((s) => {
                    const active = status === s.value
                    return (
                      <button key={s.value} onClick={() => setStatus(s.value)} className="press" style={{ flex: 1, cursor: 'pointer', borderRadius: 11, padding: 12, fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600, background: active ? '#0a0a0a' : '#fff', color: active ? '#fff' : '#6b6b6b', border: active ? '1.5px solid #0a0a0a' : '1.5px solid #ececec' }}>
                        {s.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* coluna direita: campos */}
            <div>
              <div style={fieldLabel}>Nome</div>
              <input value={name} onChange={(e) => { setName(e.target.value); if (error) setError(false) }} placeholder="O que você deseja?" style={{ ...underline, fontFamily: display, fontSize: 18, fontWeight: 600, borderBottomColor: error ? '#e2553d' : '#ececec' }} />
              {error && <div style={{ color: '#e2553d', fontSize: 12, marginTop: 6 }}>Dê um nome ao desejo</div>}

              <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ ...fieldLabel, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Preço</span>
                    <button
                      type="button"
                      onClick={cycleCurrency}
                      className="press"
                      title={`${CURRENCY_META[currency].label} — clique para mudar a moeda`}
                      style={{ cursor: 'pointer', border: '1px solid #e2e2e2', background: '#f6f6f6', borderRadius: 6, padding: '2px 7px', fontFamily: mono, fontSize: 9.5, letterSpacing: '.06em', color: '#6b6b6b', textTransform: 'none' }}
                    >
                      {CURRENCY_META[currency].symbol}
                    </button>
                  </div>
                  <input value={priceReais} onChange={(e) => setPriceReais(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="0" style={{ ...underline, fontFamily: display, fontSize: 16, fontWeight: 600 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={fieldLabel}>Link</div>
                  <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="loja.com" style={{ ...underline, fontFamily: 'var(--font-body)', fontSize: 15 }} />
                </div>
              </div>

              <div style={{ marginTop: 22 }}>
                <div style={fieldLabel}>Prioridade</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                  {PRIORITIES.map((p) => {
                    const active = priority === p.value
                    const dot = (i: number) => (active ? (i < p.ticks ? '#fff' : 'rgba(255,255,255,.35)') : i < p.ticks ? '#0a0a0a' : '#dcdcdc')
                    return (
                      <button key={p.value} onClick={() => setPriority(p.value)} className="press" style={{ cursor: 'pointer', borderRadius: 11, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: active ? '#0a0a0a' : '#fff', color: active ? '#fff' : '#1a1a1a', border: active ? '1.5px solid #0a0a0a' : '1.5px solid #ececec' }}>
                        <span style={{ fontFamily: display, fontSize: 13, fontWeight: 600 }}>{p.label}</span>
                        <div style={{ display: 'flex', gap: 3 }}>
                          {[0, 1, 2, 3].map((i) => (
                            <div key={i} style={{ width: 4, height: 11, borderRadius: 2, background: dot(i) }} />
                          ))}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ marginTop: 22 }}>
                <div style={fieldLabel}>Categorias</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {CATEGORIES.map((c) => {
                    const active = categories.includes(c)
                    return (
                      <button key={c} onClick={() => toggleCat(c)} className="press" style={{ cursor: 'pointer', borderRadius: 999, padding: '8px 14px', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, background: active ? '#0a0a0a' : '#fff', color: active ? '#fff' : '#6b6b6b', border: active ? '1.5px solid #0a0a0a' : '1.5px solid #ececec' }}>
                        {c}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ marginTop: 22 }}>
                <div style={fieldLabel}>Descrição</div>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Cor, tamanho, por que você quer…" rows={3} style={{ width: '100%', border: '1.5px solid #ececec', borderRadius: 12, background: 'none', padding: 12, fontFamily: 'var(--font-body)', fontSize: 14.5, lineHeight: 1.5, color: '#0a0a0a', outline: 'none', resize: 'none' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Overlay>
  )
}
