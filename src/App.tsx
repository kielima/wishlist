import { useEffect, useState } from 'react'
import { repository } from './repository'
import { PRIORITY_RANK } from './constants'
import type { WishItem } from './types'

/**
 * PLACEHOLDER da Fase 1. Estrutura mínima funcional para validar a stack
 * (PWA + IndexedDB + repositório). Será substituída pela interface real
 * assim que o design do Claude Design for definido.
 */
export default function App() {
  const [items, setItems] = useState<WishItem[]>([])
  const [name, setName] = useState('')

  async function refresh() {
    const all = await repository.list()
    all.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
    setItems(all)
  }

  useEffect(() => {
    refresh()
  }, [])

  async function addQuick(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await repository.create({
      name: name.trim(),
      description: '',
      link: '',
      priceCents: null,
      priority: 'could',
      status: 'wanted',
      categories: [],
      photo: null,
    })
    setName('')
    refresh()
  }

  return (
    <main className="app">
      <h1>Wishlist</h1>
      <p className="muted">
        Fundação da Fase 1 — a interface final entra quando o design chegar.
      </p>

      <form onSubmit={addQuick} className="quick-add">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Adicionar desejo rápido…"
          aria-label="Nome do desejo"
        />
        <button type="submit">Adicionar</button>
      </form>

      <ul className="items">
        {items.map((item) => (
          <li key={item.id}>
            <span>{item.name}</span>
            <button onClick={() => repository.remove(item.id).then(refresh)}>
              remover
            </button>
          </li>
        ))}
        {items.length === 0 && <li className="muted">Nenhum desejo ainda.</li>}
      </ul>
    </main>
  )
}
