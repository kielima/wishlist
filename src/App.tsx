import { useState } from 'react'
import { useWishlist } from './useWishlist'
import { fileToDataUrl } from './format'
import type { Receipt, WishItem, WishItemInput } from './types'
import Home from './screens/Home'
import Detail from './screens/Detail'
import Edit from './screens/Edit'
import Stats from './screens/Stats'
import Toast from './components/Toast'

type Screen = 'home' | 'detail' | 'edit' | 'stats'
type Filter = 'todos' | 'desejados' | 'concluidos'
type Layout = 'editorial' | 'gallery'

export default function App() {
  const { items, loading, create, update, remove } = useWishlist()

  const [screen, setScreen] = useState<Screen>('home')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<WishItem | undefined>(undefined)
  const [layout, setLayout] = useState<Layout>('editorial')
  const [filter, setFilter] = useState<Filter>('todos')
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null)

  const current = items.find((i) => i.id === selectedId)

  function flash(msg: string) {
    setToast({ msg, key: Date.now() })
  }

  function openDetail(id: string) {
    setSelectedId(id)
    setScreen('detail')
  }

  function newItem() {
    setEditingItem(undefined)
    setScreen('edit')
  }

  function editCurrent() {
    setEditingItem(current)
    setScreen('edit')
  }

  function cancelEdit() {
    setScreen(editingItem ? 'detail' : 'home')
  }

  async function handleSave(input: WishItemInput) {
    if (editingItem) {
      await update(editingItem.id, input)
      setSelectedId(editingItem.id)
    } else {
      const created = await create(input)
      setSelectedId(created.id)
    }
    setEditingItem(undefined)
    setScreen('detail')
    flash('Salvo')
  }

  async function toggleBought() {
    if (!current) return
    const next = current.status === 'wanted' ? 'bought' : 'wanted'
    await update(current.id, { status: next })
    flash(next === 'bought' ? 'Conquistado!' : 'De volta à lista')
  }

  async function deleteCurrent() {
    if (!current) return
    await remove(current.id)
    setScreen('home')
    flash('Removido')
  }

  async function attachReceipt(file: File) {
    if (!current) return
    const isImg = file.type.startsWith('image/')
    const dataUrl = await fileToDataUrl(file)
    const receipt: Receipt = {
      name: file.name,
      date: new Date().toLocaleDateString('pt-BR'),
      kind: isImg ? 'image' : 'pdf',
      dataUrl,
    }
    await update(current.id, { receipt })
    flash('Nota fiscal arquivada')
  }

  async function removeReceipt() {
    if (!current) return
    await update(current.id, { receipt: null })
    flash('Nota fiscal removida')
  }

  return (
    <div className="app-shell">
      {!loading && screen === 'home' && (
        <Home
          items={items}
          filter={filter}
          setFilter={setFilter}
          layout={layout}
          setLayout={setLayout}
          onOpen={openDetail}
          onNew={newItem}
          onStats={() => setScreen('stats')}
        />
      )}

      {screen === 'detail' && current && (
        <Detail
          item={current}
          onBack={() => setScreen('home')}
          onEdit={editCurrent}
          onDelete={deleteCurrent}
          onToggleBought={toggleBought}
          onAttachReceipt={attachReceipt}
          onRemoveReceipt={removeReceipt}
        />
      )}

      {screen === 'edit' && <Edit item={editingItem} onCancel={cancelEdit} onSave={handleSave} />}

      {screen === 'stats' && <Stats items={items} onHome={() => setScreen('home')} onNew={newItem} />}

      {toast && <Toast key={toast.key} message={toast.msg} />}
    </div>
  )
}
