import { useState } from 'react'
import { CATEGORIES, PRIORITIES, STATUSES } from '../constants'
import { fileToDataUrl } from '../format'
import type { Priority, Status, WishItem, WishItemInput } from '../types'
import { CameraIcon } from '../components/Icons'

interface Props {
  /** Item sendo editado; ausente = novo desejo. */
  item?: WishItem
  onCancel: () => void
  onSave: (input: WishItemInput) => void
}

const mono = 'var(--font-mono)'
const display = 'var(--font-display)'
const TOP_PAD = 'calc(env(safe-area-inset-top) + 26px)'

const fieldLabel: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 10,
  letterSpacing: '.1em',
  color: '#a3a3a3',
  textTransform: 'uppercase',
  marginBottom: 8,
}

const underlineInput: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: 'none',
  borderBottom: '1.5px solid #ececec',
  background: 'none',
  padding: '8px 0',
  color: '#0a0a0a',
  outline: 'none',
}

export default function Edit({ item, onCancel, onSave }: Props) {
  const [name, setName] = useState(item?.name ?? '')
  const [priceReais, setPriceReais] = useState(item?.priceCents != null ? String(Math.round(item.priceCents / 100)) : '')
  const [link, setLink] = useState(item?.link ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [priority, setPriority] = useState<Priority>(item?.priority ?? 'should')
  const [categories, setCategories] = useState<string[]>(item?.categories ?? [])
  const [status, setStatus] = useState<Status>(item?.status ?? 'wanted')
  const [photo, setPhoto] = useState<string | null>(item?.photo ?? null)
  const [error, setError] = useState(false)

  function toggleCat(c: string) {
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }

  async function onPhoto(file: File) {
    setPhoto(await fileToDataUrl(file))
  }

  function save() {
    if (!name.trim()) {
      setError(true)
      return
    }
    const cents = priceReais ? (parseInt(priceReais, 10) || 0) * 100 : null
    onSave({
      name: name.trim(),
      description: description.trim(),
      link: link.trim(),
      priceCents: cents,
      priority,
      status,
      categories,
      photo,
      receipt: item?.receipt ?? null,
    })
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#ffffff', animation: 'screenIn .3s cubic-bezier(.2,.7,.2,1) both' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${TOP_PAD} 20px 10px` }}>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 15, color: '#9a9a9a', padding: 6 }}>
          Cancelar
        </button>
        <div style={{ fontFamily: display, fontSize: 16, fontWeight: 600, color: '#0a0a0a' }}>{item ? 'Editar desejo' : 'Novo desejo'}</div>
        <button onClick={save} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, color: '#0a0a0a', padding: 6 }}>
          Salvar
        </button>
      </div>

      <div data-scroll style={{ flex: 1, overflow: 'auto', padding: '10px 22px calc(28px + env(safe-area-inset-bottom))' }}>
        {/* foto */}
        <label style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', aspectRatio: '2.1', borderRadius: 18, background: photo ? '#000' : '#fafafa', border: photo ? 'none' : '1.5px dashed #dcdcdc', cursor: 'pointer', overflow: 'hidden' }}>
          {photo ? (
            <img src={photo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <>
              <CameraIcon />
              <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.06em', color: '#b0b0b0', textTransform: 'uppercase' }}>Adicionar foto</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onPhoto(f)
              e.target.value = ''
            }}
            style={{ display: 'none' }}
          />
        </label>

        {/* nome */}
        <div style={{ marginTop: 22 }}>
          <div style={fieldLabel}>Nome</div>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError(false)
            }}
            placeholder="O que você deseja?"
            style={{ ...underlineInput, fontFamily: display, fontSize: 18, fontWeight: 600, borderBottomColor: error ? '#e2553d' : '#ececec' }}
          />
          {error && <div style={{ color: '#e2553d', fontSize: 12, marginTop: 6 }}>Dê um nome ao desejo</div>}
        </div>

        {/* preço + link */}
        <div style={{ display: 'flex', gap: 16, marginTop: 22 }}>
          <div style={{ flex: 1 }}>
            <div style={fieldLabel}>Preço (R$)</div>
            <input value={priceReais} onChange={(e) => setPriceReais(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="0" style={{ ...underlineInput, fontFamily: display, fontSize: 16, fontWeight: 600 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={fieldLabel}>Link</div>
            <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="loja.com" style={{ ...underlineInput, fontFamily: 'var(--font-body)', fontSize: 15 }} />
          </div>
        </div>

        {/* prioridade */}
        <div style={{ marginTop: 26 }}>
          <div style={{ ...fieldLabel, marginBottom: 10 }}>Prioridade</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
            {PRIORITIES.map((p) => {
              const active = priority === p.value
              const dot = (idx: number) =>
                active ? (idx < p.ticks ? '#ffffff' : 'rgba(255,255,255,.35)') : idx < p.ticks ? '#0a0a0a' : '#dcdcdc'
              return (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className="press"
                  style={{ cursor: 'pointer', borderRadius: 12, padding: '13px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: active ? '#0a0a0a' : '#ffffff', color: active ? '#fff' : '#1a1a1a', border: active ? '1.5px solid #0a0a0a' : '1.5px solid #ececec' }}
                >
                  <span style={{ fontFamily: display, fontSize: 13.5, fontWeight: 600 }}>{p.label}</span>
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

        {/* categorias */}
        <div style={{ marginTop: 26 }}>
          <div style={{ ...fieldLabel, marginBottom: 10 }}>Categorias</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map((c) => {
              const active = categories.includes(c)
              return (
                <button
                  key={c}
                  onClick={() => toggleCat(c)}
                  className="press"
                  style={{ cursor: 'pointer', borderRadius: 999, padding: '9px 14px', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, background: active ? '#0a0a0a' : '#ffffff', color: active ? '#fff' : '#6b6b6b', border: active ? '1.5px solid #0a0a0a' : '1.5px solid #ececec' }}
                >
                  {c}
                </button>
              )
            })}
          </div>
        </div>

        {/* descrição */}
        <div style={{ marginTop: 26 }}>
          <div style={{ ...fieldLabel, marginBottom: 8 }}>Descrição</div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Cor, tamanho, por que você quer…" rows={3} style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #ececec', borderRadius: 13, background: 'none', padding: 13, fontFamily: 'var(--font-body)', fontSize: 14.5, lineHeight: 1.5, color: '#0a0a0a', outline: 'none', resize: 'none' }} />
        </div>

        {/* status */}
        <div style={{ marginTop: 26 }}>
          <div style={{ ...fieldLabel, marginBottom: 10 }}>Status</div>
          <div style={{ display: 'flex', gap: 9 }}>
            {STATUSES.map((s) => {
              const active = status === s.value
              return (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className="press"
                  style={{ flex: 1, cursor: 'pointer', borderRadius: 12, padding: 13, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, background: active ? '#0a0a0a' : '#ffffff', color: active ? '#fff' : '#6b6b6b', border: active ? '1.5px solid #0a0a0a' : '1.5px solid #ececec' }}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
