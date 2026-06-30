import { useEffect, useMemo, useState } from 'react'
import { useWishlist } from './useWishlist'
import { useViewport } from './useViewport'
import { fileToDataUrl, primaryCategory } from './format'
import { PRICE_MAX, PRICE_MIN, PRIORITY_META, type SortBy } from './constants'
import { RatesContext, toBRLCents, useLiveRates } from './currency'
import { resolveClip, takePendingClip, type ClipPrefill } from './clip'
import { isSupabaseConfigured } from './supabase'
import { signOut, useSession } from './auth'
import type { Priority, Receipt, WishItem, WishItemInput } from './types'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import TopBar from './components/TopBar'
import BottomBar from './components/BottomBar'
import { CompactList, GalleryGrid, ItemTable } from './components/ItemViews'
import ResumoPanel from './components/ResumoPanel'
import FilterDrawer from './components/FilterDrawer'
import ActiveChips, { type Chip } from './components/ActiveChips'
import DetailModal from './components/DetailModal'
import EditModal from './components/EditModal'
import Login from './screens/Login'
import Toast from './components/Toast'

type Filter = 'todos' | 'desejados' | 'concluidos' | 'favoritos'
type Layout = 'editorial' | 'gallery'
type Modal = 'detail' | 'edit' | null

const HEADINGS: Record<Filter, string> = { todos: 'Tudo', desejados: 'Desejados', concluidos: 'Concluídos', favoritos: 'Favoritos' }

function WishlistApp({ onSignOut }: { onSignOut?: () => void }) {
  const { items, create, update, remove } = useWishlist()
  const rates = useLiveRates()
  const vp = useViewport()
  const { isNarrow, hasSidebar, isWide } = vp

  const [filter, setFilter] = useState<Filter>('todos')
  const [categories, setCategories] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortBy>('priceAsc')
  const [priorities, setPriorities] = useState<Priority[]>([])
  const [priceMin, setPriceMin] = useState(PRICE_MIN)
  const [priceMax, setPriceMax] = useState(PRICE_MAX)
  const [layout, setLayout] = useState<Layout>('editorial')
  const [query, setQuery] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [modal, setModal] = useState<Modal>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<WishItem | undefined>(undefined)
  const [clipPrefill, setClipPrefill] = useState<ClipPrefill | undefined>(undefined)
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null)

  const current = items.find((i) => i.id === selectedId)

  const wantedTotal = items
    .filter((i) => i.status === 'wanted')
    .reduce((s, i) => s + toBRLCents(i.priceCents, i.currency, rates), 0)

  const priceActive = priceMin > PRICE_MIN || priceMax < PRICE_MAX
  const filterCount = priorities.length + categories.length + (priceActive ? 1 : 0)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const brlReais = (i: WishItem) => toBRLCents(i.priceCents, i.currency, rates) / 100
    const statusFn =
      filter === 'desejados'
        ? (i: WishItem) => i.status === 'wanted'
        : filter === 'concluidos'
          ? (i: WishItem) => i.status === 'bought'
          : filter === 'favoritos'
            ? (i: WishItem) => !!i.favorite
            : () => true
    const upper = priceMax >= PRICE_MAX ? Infinity : priceMax
    const filtered = items.filter((i) => {
      const reais = brlReais(i)
      return (
        statusFn(i) &&
        (categories.length === 0 || categories.includes(primaryCategory(i))) &&
        (priorities.length === 0 || priorities.includes(i.priority)) &&
        reais >= priceMin &&
        reais <= upper &&
        (!q || i.name.toLowerCase().includes(q) || primaryCategory(i).toLowerCase().includes(q))
      )
    })
    return filtered.sort((a, b) => {
      if (sortBy === 'priceDesc') return brlReais(b) - brlReais(a)
      if (sortBy === 'priceAsc') return brlReais(a) - brlReais(b)
      if (sortBy === 'alpha') return a.name.localeCompare(b.name, 'pt-BR')
      // 'priority': desejados antes de comprados, depois por urgência, depois nome
      if ((a.status === 'bought') !== (b.status === 'bought')) return a.status === 'bought' ? 1 : -1
      return PRIORITY_META[a.priority].rank - PRIORITY_META[b.priority].rank || a.name.localeCompare(b.name, 'pt-BR')
    })
  }, [items, filter, categories, priorities, priceMin, priceMax, query, sortBy, rates])

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
    setFilterOpen(false)
    setPanelOpen((v) => !v)
  }
  function openFilter() {
    setPanelOpen(false)
    setFilterOpen(true)
  }
  function togglePriority(p: Priority) {
    setPriorities((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }
  function toggleCategory(c: string) {
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }
  function resetPrice() {
    setPriceMin(PRICE_MIN)
    setPriceMax(PRICE_MAX)
  }
  function clearFilters() {
    setPriorities([])
    setCategories([])
    resetPrice()
  }

  async function toggleFav(id: string) {
    const it = items.find((i) => i.id === id)
    if (!it) return
    await update(id, { favorite: !it.favorite })
    flash(it.favorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos')
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
    setClipPrefill(undefined)
    setModal(null)
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
  const heading = categories.length === 1 ? categories[0] : HEADINGS[filter]

  const priceLabel =
    'R$ ' + priceMin.toLocaleString('pt-BR') + ' — R$ ' + priceMax.toLocaleString('pt-BR') + (priceMax >= PRICE_MAX ? '+' : '')
  const activeChips: Chip[] = [
    ...priorities.map((p) => ({ key: `pri:${p}`, label: PRIORITY_META[p].label, onRemove: () => togglePriority(p) })),
    ...categories.map((c) => ({ key: `cat:${c}`, label: c, onRemove: () => toggleCategory(c) })),
    ...(priceActive ? [{ key: 'price', label: priceLabel, onRemove: resetPrice }] : []),
  ]

  return (
    <RatesContext.Provider value={rates}>
    <div className="wl-root">
      {hasSidebar && (
        <Sidebar items={items} filter={filter} setFilter={setFilter} categories={categories} toggleCategory={toggleCategory} clearCategories={() => setCategories([])} onNew={newItem} />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        {isNarrow ? (
          <TopBar items={items} filter={filter} setFilter={setFilter} layout={layout} setLayout={setLayout} totalWantedCents={wantedTotal} filterCount={filterCount} onOpenFilter={openFilter} />
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
            filterOpen={filterOpen}
            filterCount={filterCount}
            onOpenFilter={openFilter}
          />
        )}

        <ActiveChips chips={activeChips} onClearAll={clearFilters} />

        <div id="main-scroll" data-scroll style={{ flex: 1, overflow: 'auto', transition: 'padding-right .32s cubic-bezier(.3,.7,.2,1)', paddingRight: panelInline ? 362 : 0, paddingBottom: isNarrow ? 88 : 0 }}>
          {visible.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '90px 24px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>Nada por aqui</span>
              <span style={{ fontSize: 14, color: '#9a9a9a' }}>Ajuste os filtros ou adicione um novo desejo</span>
            </div>
          ) : layout === 'gallery' ? (
            <GalleryGrid items={visible} isNarrow={isNarrow} onOpen={openDetail} onToggleFav={toggleFav} />
          ) : hasSidebar ? (
            <ItemTable items={visible} width={vp.width} onOpen={openDetail} onToggleFav={toggleFav} />
          ) : (
            <CompactList items={visible} onOpen={openDetail} onToggleFav={toggleFav} />
          )}
        </div>
      </div>

      {showBackdrop && (
        <div onClick={() => setPanelOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,10,.28)', zIndex: 40, animation: 'fadeIn .25s ease' }} />
      )}
      <ResumoPanel items={items} open={panelOpen} inline={panelInline} isNarrow={isNarrow} onClose={() => setPanelOpen(false)} onSignOut={onSignOut} />

      {filterOpen && (
        <div onClick={() => setFilterOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,10,.28)', zIndex: 42, animation: 'fadeIn .25s ease' }} />
      )}
      <FilterDrawer
        open={filterOpen}
        isNarrow={isNarrow}
        onClose={() => setFilterOpen(false)}
        sortBy={sortBy}
        setSortBy={setSortBy}
        priorities={priorities}
        togglePriority={togglePriority}
        priceMin={priceMin}
        priceMax={priceMax}
        setPriceMin={setPriceMin}
        setPriceMax={setPriceMax}
        selectedCats={categories}
        toggleCat={toggleCategory}
        onClear={clearFilters}
        resultCount={visible.length}
      />

      {isNarrow && (
        <BottomBar
          onHome={() => document.getElementById('main-scroll')?.scrollTo({ top: 0, behavior: 'smooth' })}
          onNew={newItem}
          onOpenPanel={() => setPanelOpen(true)}
        />
      )}

      {modal === 'detail' && current && (
        <DetailModal item={current} vp={vp} onClose={closeModal} onEdit={editCurrent} onDelete={deleteCurrent} onToggleBought={toggleBought} onToggleFav={() => toggleFav(current.id)} onAttachReceipt={attachReceipt} onRemoveReceipt={removeReceipt} />
      )}
      {modal === 'edit' && <EditModal item={editingItem} prefill={clipPrefill} vp={vp} onClose={closeModal} onSave={handleSave} />}

      {toast && <Toast key={toast.key} message={toast.msg} />}
    </div>
    </RatesContext.Provider>
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
