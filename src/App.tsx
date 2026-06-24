import { useEffect, useMemo, useState } from 'react'
import { useWishlist } from './useWishlist'
import { useViewport } from './useViewport'
import { fileToDataUrl, primaryCategory, sortItems } from './format'
import { resolveClip, takePendingClip, type ClipPrefill } from './clip'
import { isSupabaseConfigured } from './supabase'
import { signOut, useSession } from './auth'
import type { Receipt, WishItem, WishItemInput } from './types'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import TopBar from './components/TopBar'
import { CompactList, GalleryGrid, ItemTable } from './components/ItemViews'
import ResumoPanel from './components/ResumoPanel'
import DetailModal from './components/DetailModal'
import EditModal from './components/EditModal'
import Login from './screens/Login'
import Toast from './components/Toast'

type Filter = 'todos' | 'desejados' | 'concluidos'
type Layout = 'editorial' | 'gallery'
type Modal = 'detail' | 'edit' | null

const HEADINGS: Record<Filter, string> = { todos: 'Tudo', desejados: 'Desejados', concluidos: 'Concluídos' }

function WishlistApp({ onSignOut }: { onSignOut?: () => void }) {
  const { items, create, update, remove } = useWishlist()
  const vp = useViewport()
  const { isNarrow, hasSidebar, isWide } = vp

  const [filter, setFilter] = useState<Filter>('todos')
  const [category, setCategory] = useState<string | null>(null)
  const [layout, setLayout] = useState<Layout>('editorial')
  const [query, setQuery] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [modal, setModal] = useState<Modal>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<WishItem | undefined>(undefined)
  const [clipPrefill, setClipPrefill] = useState<ClipPrefill | undefined>(undefined)
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null)

  const current = items.find((i) => i.id === selectedId)

  const wantedTotal = items.filter((i) => i.status === 'wanted').reduce((s, i) => s + (i.priceCents ?? 0), 0)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const statusFn =
      filter === 'desejados'
        ? (i: WishItem) => i.status === 'wanted'
        : filter === 'concluidos'
          ? (i: WishItem) => i.status === 'bought'
          : () => true
    return sortItems(items).filter(
      (i) =>
        statusFn(i) &&
        (!category || primaryCategory(i) === category) &&
        (!q || i.name.toLowerCase().includes(q) || primaryCategory(i).toLowerCase().includes(q)),
    )
  }, [items, filter, category, query])

  function flash(msg: string) {
    setToast({ msg, key: Date.now() })
  }

  // Webclipper: ao abrir via Compartilhar/extensão, busca os dados do produto
  // e abre "Novo desejo" já preenchido.
  useEffect(() => {
    const pending = takePendingClip()
    if (!pending) return
    setToast({ msg: 'Buscando dados do produto…', key: Date.now() })
    resolveClip(pending).then((pf) => {
      setClipPrefill(pf)
      setEditingItem(undefined)
      setModal('edit')
    })
  }, [])

  function openDetail(id: string) {
    setSelectedId(id)
    setModal('detail')
  }
  function newItem() {
    setEditingItem(undefined)
    setClipPrefill(undefined)
    setModal('edit')
  }
  function editCurrent() {
    setEditingItem(current)
    setModal('edit')
  }
  function closeModal() {
    setModal(null)
    setEditingItem(undefined)
    setClipPrefill(undefined)
  }
  function togglePanel() {
    setPanelOpen((v) => !v)
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
    setModal('detail')
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
    closeModal()
    flash('Removido')
  }

  async function attachReceipt(file: File) {
    if (!current) return
    const isImg = file.type.startsWith('image/')
    const dataUrl = await fileToDataUrl(file)
    const receipt: Receipt = { name: file.name, date: new Date().toLocaleDateString('pt-BR'), kind: isImg ? 'image' : 'pdf', dataUrl }
    await update(current.id, { receipt })
    flash('Nota fiscal arquivada')
  }

  async function removeReceipt() {
    if (!current) return
    await update(current.id, { receipt: null })
    flash('Nota fiscal removida')
  }

  const panelInline = isWide && panelOpen
  const showBackdrop = panelOpen && !panelInline
  const heading = category ?? HEADINGS[filter]

  return (
    <div className="wl-root">
      {hasSidebar && (
        <Sidebar items={items} filter={filter} setFilter={setFilter} category={category} setCategory={setCategory} onNew={newItem} />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        {isNarrow ? (
          <TopBar items={items} filter={filter} setFilter={setFilter} onNew={newItem} onOpenPanel={() => setPanelOpen(true)} />
        ) : (
          <Header
            heading={heading}
            resultCount={visible.length}
            totalWantedCents={wantedTotal}
            query={query}
            setQuery={setQuery}
            layout={layout}
            setLayout={setLayout}
            panelOpen={panelOpen}
            onTogglePanel={togglePanel}
          />
        )}

        <div data-scroll style={{ flex: 1, overflow: 'auto', transition: 'padding-right .32s cubic-bezier(.3,.7,.2,1)', paddingRight: panelInline ? 362 : 0 }}>
          {visible.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '90px 24px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>Nada por aqui</span>
              <span style={{ fontSize: 14, color: '#9a9a9a' }}>Ajuste os filtros ou adicione um novo desejo</span>
            </div>
          ) : layout === 'gallery' ? (
            <GalleryGrid items={visible} isNarrow={isNarrow} onOpen={openDetail} />
          ) : hasSidebar ? (
            <ItemTable items={visible} width={vp.width} onOpen={openDetail} />
          ) : (
            <CompactList items={visible} onOpen={openDetail} />
          )}
        </div>
      </div>

      {showBackdrop && (
        <div onClick={() => setPanelOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,10,.28)', zIndex: 40, animation: 'fadeIn .25s ease' }} />
      )}
      <ResumoPanel items={items} open={panelOpen} inline={panelInline} isNarrow={isNarrow} onClose={() => setPanelOpen(false)} onSignOut={onSignOut} />

      {modal === 'detail' && current && (
        <DetailModal item={current} vp={vp} onClose={closeModal} onEdit={editCurrent} onDelete={deleteCurrent} onToggleBought={toggleBought} onAttachReceipt={attachReceipt} onRemoveReceipt={removeReceipt} />
      )}
      {modal === 'edit' && <EditModal item={editingItem} prefill={clipPrefill} vp={vp} onClose={closeModal} onSave={handleSave} />}

      {toast && <Toast key={toast.key} message={toast.msg} />}
    </div>
  )
}

/** Portão de autenticação: no modo Supabase, exige login antes do app. */
export default function App() {
  const { session, loading } = useSession()

  if (!isSupabaseConfigured) return <WishlistApp />

  if (loading) return <div className="wl-root" />

  if (!session) {
    return (
      <div className="wl-root" style={{ justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column' }}>
          <Login />
        </div>
      </div>
    )
  }

  return <WishlistApp onSignOut={signOut} />
}
