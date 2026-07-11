import { useEffect, useMemo, useState } from 'react'
import { useWishlist } from './useWishlist'
import { useCategories, type CategoryResult } from './useCategories'
import { useViewport } from './useViewport'
import { fileToDataUrl, primaryCategory, storeName } from './format'
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
import CategoryManager from './components/CategoryManager'
import Login from './screens/Login'
import Toast from './components/Toast'

type Filter = 'desejados' | 'concluidos' | 'favoritos'
type Layout = 'editorial' | 'gallery'
type Modal = 'detail' | 'edit' | null

const HEADINGS: Record<Filter, string> = { desejados: 'Desejados', concluidos: 'Concluídos', favoritos: 'Favoritos' }

function WishlistApp({ onSignOut }: { onSignOut?: () => void }) {
  const { items, loading: itemsLoading, create, update, remove } = useWishlist()
  const { categories: allCategories, ensure: ensureCategories, add: addCategory, rename: renameCategoryStore, remove: removeCategoryStore } = useCategories()
  const rates = useLiveRates()
  const vp = useViewport()
  const { isNarrow, hasSidebar, isWide } = vp

  const [filter, setFilter] = useState<Filter>('desejados')
  const [categories, setCategories] = useState<string[]>([])
  const [stores, setStores] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortBy>('priceAsc')
  const [priorities, setPriorities] = useState<Priority[]>([])
  const [priceMin, setPriceMin] = useState(PRICE_MIN)
  const [priceMax, setPriceMax] = useState(PRICE_MAX)
  const [layout, setLayout] = useState<Layout>('editorial')
  const [query, setQuery] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      return localStorage.getItem('wl:sidebar') !== '0'
    } catch {
      return true
    }
  })
  const [catManagerOpen, setCatManagerOpen] = useState(false)
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
  const filterCount = priorities.length + categories.length + stores.length + (priceActive ? 1 : 0)

  // Loja de cada item, agrupada por link. Lojas com menos de 2 itens caem em
  // "Outros" — o objetivo é juntar itens da mesma loja para economizar frete.
  const itemStore = useMemo(() => {
    const rawCounts: Record<string, number> = {}
    items.forEach((i) => {
      const s = storeName(i.link)
      if (s) rawCounts[s] = (rawCounts[s] ?? 0) + 1
    })
    const map = new Map<string, string>()
    items.forEach((i) => {
      const s = storeName(i.link)
      map.set(i.id, s && rawCounts[s] >= 2 ? s : 'Outros')
    })
    return map
  }, [items])

  const storeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    itemStore.forEach((s) => {
      counts[s] = (counts[s] ?? 0) + 1
    })
    return counts
  }, [itemStore])

  const allStores = useMemo(() => {
    const names = Object.keys(storeCounts)
      .filter((s) => s !== 'Outros')
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    return storeCounts['Outros'] ? [...names, 'Outros'] : names
  }, [storeCounts])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const brlReais = (i: WishItem) => toBRLCents(i.priceCents, i.currency, rates) / 100
    const statusFn =
      filter === 'desejados'
        ? (i: WishItem) => i.status === 'wanted'
        : filter === 'concluidos'
          ? (i: WishItem) => i.status === 'bought'
          : (i: WishItem) => !!i.favorite
    const upper = priceMax >= PRICE_MAX ? Infinity : priceMax
    const filtered = items.filter((i) => {
      const reais = brlReais(i)
      return (
        statusFn(i) &&
        (categories.length === 0 || categories.includes(primaryCategory(i))) &&
        (stores.length === 0 || stores.includes(itemStore.get(i.id) ?? 'Outros')) &&
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
  }, [items, filter, categories, stores, itemStore, priorities, priceMin, priceMax, query, sortBy, rates])

  // Contagem de itens por categoria (usada no menu lateral e no gerenciador).
  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    items.forEach((i) => {
      const c = primaryCategory(i)
      counts[c] = (counts[c] ?? 0) + 1
    })
    return counts
  }, [items])

  // Garante que qualquer categoria já usada por um item apareça nas opções,
  // mesmo que tenha vindo de outro aparelho ou de uma versão anterior.
  useEffect(() => {
    if (items.length) ensureCategories(items.flatMap((i) => i.categories))
  }, [items, ensureCategories])

  function flash(msg: string) {
    setToast({ msg, key: Date.now() })
  }

  function handleAddCategory(name: string): CategoryResult {
    return addCategory(name)
  }

  function handleRenameCategory(oldName: string, newName: string): CategoryResult {
    const res = renameCategoryStore(oldName, newName)
    if (!res.ok) return res
    const next = newName.trim()
    // Propaga o novo nome para os itens que usavam a categoria antiga.
    items
      .filter((i) => i.categories.includes(oldName))
      .forEach((i) => {
        const updated = i.categories.map((c) => (c === oldName ? next : c))
        void update(i.id, { categories: Array.from(new Set(updated)) })
      })
    // Mantém o filtro ativo coerente com o novo nome.
    setCategories((prev) => prev.map((c) => (c === oldName ? next : c)))
    return res
  }

  function handleRemoveCategory(name: string) {
    removeCategoryStore(name)
    items
      .filter((i) => i.categories.includes(name))
      .forEach((i) => void update(i.id, { categories: i.categories.filter((c) => c !== name) }))
    setCategories((prev) => prev.filter((c) => c !== name))
  }

  // Webclipper: ao abrir via Compartilhar/extensão, busca os dados do produto
  // e abre "Novo desejo" já preenchido.
  const [pendingClipPrefill, setPendingClipPrefill] = useState<ClipPrefill | null>(null)
  useEffect(() => {
    const pending = takePendingClip()
    if (!pending) return
    setToast({ msg: 'Buscando dados do produto…', key: Date.now() })
    resolveClip(pending).then(setPendingClipPrefill)
  }, [])

  // Espera a wishlist carregar antes de casar pelo link — assim, se o item já
  // existe (ex.: salvo pelo celular sem foto/preço porque a loja bloqueou o
  // scraping), a extensão completa ESSE item em vez de criar um duplicado.
  useEffect(() => {
    if (!pendingClipPrefill || itemsLoading) return
    const match = pendingClipPrefill.link ? items.find((i) => i.link === pendingClipPrefill.link) : undefined
    setClipPrefill(pendingClipPrefill)
    setEditingItem(match)
    setModal('edit')
    setPendingClipPrefill(null)
  }, [pendingClipPrefill, itemsLoading, items])

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
  function toggleSidebar() {
    setSidebarOpen((v) => {
      const next = !v
      try {
        localStorage.setItem('wl:sidebar', next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
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
  function toggleStore(s: string) {
    setStores((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }
  function resetPrice() {
    setPriceMin(PRICE_MIN)
    setPriceMax(PRICE_MAX)
  }
  function clearFilters() {
    setPriorities([])
    setCategories([])
    setStores([])
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
    ...stores.map((s) => ({ key: `store:${s}`, label: s, onRemove: () => toggleStore(s) })),
    ...(priceActive ? [{ key: 'price', label: priceLabel, onRemove: resetPrice }] : []),
  ]

  return (
    <RatesContext.Provider value={rates}>
    <div className="wl-root">
      {hasSidebar && sidebarOpen && (
        <Sidebar items={items} filter={filter} setFilter={setFilter} allCategories={allCategories} categories={categories} toggleCategory={toggleCategory} clearCategories={() => setCategories([])} onNew={newItem} onCollapse={toggleSidebar} onManageCategories={() => setCatManagerOpen(true)} />
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
            sidebarOpen={sidebarOpen}
            onToggleSidebar={toggleSidebar}
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
        allCategories={allCategories}
        selectedCats={categories}
        toggleCat={toggleCategory}
        allStores={allStores}
        selectedStores={stores}
        toggleStore={toggleStore}
        onClear={clearFilters}
        onManageCategories={() => setCatManagerOpen(true)}
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
      {modal === 'edit' && <EditModal item={editingItem} prefill={clipPrefill} vp={vp} categories={allCategories} onAddCategory={handleAddCategory} onManageCategories={() => setCatManagerOpen(true)} onClose={closeModal} onSave={handleSave} />}

      {catManagerOpen && (
        <CategoryManager
          categories={allCategories}
          counts={catCounts}
          vp={vp}
          onClose={() => setCatManagerOpen(false)}
          onAdd={handleAddCategory}
          onRename={handleRenameCategory}
          onRemove={handleRemoveCategory}
        />
      )}

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
