import { useState } from 'react'
import type { Viewport } from '../useViewport'
import type { CategoryResult } from '../useCategories'
import { CloseIcon, PencilIcon, PlusSmall, TrashIcon } from './Icons'
import { Overlay } from './DetailModal'

interface Props {
  categories: string[]
  /** Nº de itens por categoria — mostra o impacto de renomear/excluir. */
  counts: Record<string, number>
  vp: Viewport
  onClose: () => void
  onAdd: (name: string) => CategoryResult
  onRename: (oldName: string, newName: string) => CategoryResult
  onRemove: (name: string) => void
}

const display = 'var(--font-display)'
const mono = 'var(--font-mono)'
const body = 'var(--font-body)'

const fieldLabel: React.CSSProperties = { fontFamily: mono, fontSize: 9.5, letterSpacing: '.1em', color: '#a3a3a3', textTransform: 'uppercase', marginBottom: 8 }

export default function CategoryManager({ categories, counts, vp, onClose, onAdd, onRename, onRemove }: Props) {
  const { isNarrow, width } = vp
  const [newName, setNewName] = useState('')
  const [addError, setAddError] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const w = isNarrow ? '100%' : width < 620 ? 460 : 520

  function submitAdd() {
    const res = onAdd(newName)
    if (!res.ok) {
      setAddError(res.error)
      return
    }
    setNewName('')
    setAddError('')
  }

  function startEdit(name: string) {
    setEditing(name)
    setEditValue(name)
    setEditError('')
    setConfirmDelete(null)
  }

  function submitEdit(oldName: string) {
    const res = onRename(oldName, editValue)
    if (!res.ok) {
      setEditError(res.error)
      return
    }
    setEditing(null)
    setEditError('')
  }

  const iconBtn: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    borderRadius: 8,
    padding: 7,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  return (
    <Overlay isNarrow={isNarrow} onClose={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: isNarrow ? 0 : 22, width: w, maxWidth: '100%', height: isNarrow ? '100%' : 'auto', maxHeight: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 70px rgba(0,0,0,.3)', animation: 'modalIn .3s cubic-bezier(.2,.7,.2,1) both' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f0f0f0' }}>
          <div>
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.16em', color: '#bdbdbd' }}>ORGANIZAR</div>
            <div style={{ fontFamily: display, fontSize: 18, fontWeight: 700, marginTop: 3 }}>Categorias</div>
          </div>
          <button onClick={onClose} className="soft-hover" style={{ background: '#f4f4f4', border: 'none', cursor: 'pointer', width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CloseIcon size={13} color="#6b6b6b" />
          </button>
        </div>

        <div data-scroll style={{ flex: 1, overflow: 'auto', padding: '22px 24px 28px' }}>
          {/* adicionar nova */}
          <div style={fieldLabel}>Nova categoria</div>
          <div style={{ display: 'flex', gap: 9 }}>
            <input
              value={newName}
              onChange={(e) => { setNewName(e.target.value); if (addError) setAddError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') submitAdd() }}
              placeholder="Ex.: Presentes"
              style={{ flex: 1, border: '1.5px solid #ececec', borderRadius: 11, background: 'none', padding: '11px 13px', fontFamily: body, fontSize: 14, color: '#0a0a0a', outline: 'none' }}
            />
            <button onClick={submitAdd} className="press" style={{ flexShrink: 0, background: '#0a0a0a', border: 'none', cursor: 'pointer', borderRadius: 11, padding: '0 16px', fontFamily: body, fontSize: 13.5, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 7 }}>
              <PlusSmall />
              Adicionar
            </button>
          </div>
          {addError && <div style={{ color: '#e2553d', fontSize: 12, marginTop: 7 }}>{addError}</div>}

          {/* lista */}
          <div style={{ ...fieldLabel, marginTop: 24 }}>Suas categorias</div>
          {categories.length === 0 ? (
            <div style={{ fontFamily: body, fontSize: 13.5, color: '#9a9a9a', padding: '8px 0' }}>Nenhuma categoria ainda.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {categories.map((c) => {
                const count = counts[c] ?? 0
                const isEditing = editing === c
                const isConfirming = confirmDelete === c
                return (
                  <div key={c} style={{ border: '1.5px solid #ececec', borderRadius: 12, padding: isEditing || isConfirming ? '12px 12px' : '10px 12px' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            autoFocus
                            value={editValue}
                            onChange={(e) => { setEditValue(e.target.value); if (editError) setEditError('') }}
                            onKeyDown={(e) => { if (e.key === 'Enter') submitEdit(c); if (e.key === 'Escape') setEditing(null) }}
                            style={{ flex: 1, border: '1.5px solid #dcdcdc', borderRadius: 9, background: 'none', padding: '9px 11px', fontFamily: body, fontSize: 14, color: '#0a0a0a', outline: 'none' }}
                          />
                          <button onClick={() => submitEdit(c)} className="press" style={{ background: '#0a0a0a', border: 'none', cursor: 'pointer', borderRadius: 9, padding: '0 15px', fontFamily: body, fontSize: 13, fontWeight: 600, color: '#fff' }}>Salvar</button>
                          <button onClick={() => setEditing(null)} className="soft-hover" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: body, fontSize: 13, color: '#9a9a9a', padding: '0 6px' }}>Cancelar</button>
                        </div>
                        {editError && <div style={{ color: '#e2553d', fontSize: 12 }}>{editError}</div>}
                      </div>
                    ) : isConfirming ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                        <div style={{ fontFamily: body, fontSize: 13.5, color: '#1a1a1a' }}>
                          Excluir <strong>{c}</strong>?
                          {count > 0 && <span style={{ color: '#9a9a9a' }}> Será removida de {count} {count === 1 ? 'item' : 'itens'}.</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => { onRemove(c); setConfirmDelete(null) }} className="press" style={{ background: '#e2553d', border: 'none', cursor: 'pointer', borderRadius: 9, padding: '9px 15px', fontFamily: body, fontSize: 13, fontWeight: 600, color: '#fff' }}>Excluir</button>
                          <button onClick={() => setConfirmDelete(null)} className="soft-hover" style={{ background: '#f4f4f4', border: 'none', cursor: 'pointer', borderRadius: 9, padding: '9px 15px', fontFamily: body, fontSize: 13, fontWeight: 600, color: '#0a0a0a' }}>Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontFamily: body, fontSize: 14, fontWeight: 600, color: '#0a0a0a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c}</span>
                          <span style={{ fontFamily: display, fontSize: 11.5, color: '#c4c4c4', flexShrink: 0 }}>{count}</span>
                        </div>
                        <div style={{ display: 'flex', flexShrink: 0 }}>
                          <button onClick={() => startEdit(c)} className="soft-hover" title="Renomear" aria-label={`Renomear ${c}`} style={iconBtn}>
                            <PencilIcon />
                          </button>
                          <button onClick={() => { setConfirmDelete(c); setEditing(null) }} className="soft-hover" title="Excluir" aria-label={`Excluir ${c}`} style={iconBtn}>
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Overlay>
  )
}
