import { useCallback, useEffect, useState } from 'react'
import { CATEGORIES } from './constants'

/**
 * Lista de categorias gerenciável pelo usuário (adicionar/renomear/excluir).
 *
 * As categorias vivem nos próprios itens (campo `categories`), mas a lista de
 * opções disponíveis é uma preferência por aparelho — guardada em localStorage.
 * A semeadura inicial usa `CATEGORIES` (as sugestões originais). A propagação de
 * renomear/excluir para os itens é feita no App, que tem acesso ao repositório.
 */

const STORAGE_KEY = 'wl:categories'

const norm = (s: string) => s.trim().toLowerCase()

/** Remove duplicados (case/espaço-insensitive), mantendo a primeira ocorrência. */
function dedupe(cats: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const c of cats) {
    const key = norm(c)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(c)
  }
  return result
}

function load(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.every((c) => typeof c === 'string')) return dedupe(parsed)
    }
  } catch {
    /* localStorage indisponível → cai no default */
  }
  return [...CATEGORIES]
}

function save(cats: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cats))
  } catch {
    /* ignore */
  }
}

/** Resultado de uma operação de escrita — `ok:false` traz o motivo para a UI. */
export type CategoryResult = { ok: true } | { ok: false; error: string }

export function useCategories() {
  const [categories, setCategories] = useState<string[]>(load)

  useEffect(() => {
    save(categories)
  }, [categories])

  /** Garante que categorias já em uso pelos itens apareçam na lista. */
  const ensure = useCallback((names: string[]) => {
    setCategories((prev) => {
      const have = new Set(prev.map(norm))
      const extra: string[] = []
      for (const n of names) {
        const t = n.trim()
        if (!t) continue
        const key = norm(t)
        if (have.has(key)) continue
        have.add(key)
        extra.push(t)
      }
      return extra.length ? [...prev, ...extra] : prev
    })
  }, [])

  const add = useCallback(
    (name: string): CategoryResult => {
      const n = name.trim()
      if (!n) return { ok: false, error: 'Dê um nome à categoria' }
      if (categories.some((c) => norm(c) === norm(n))) return { ok: false, error: 'Essa categoria já existe' }
      setCategories((prev) => [...prev, n])
      return { ok: true }
    },
    [categories],
  )

  const rename = useCallback(
    (oldName: string, newName: string): CategoryResult => {
      const n = newName.trim()
      if (!n) return { ok: false, error: 'Dê um nome à categoria' }
      if (norm(n) === norm(oldName)) return { ok: true }
      if (categories.some((c) => norm(c) === norm(n))) return { ok: false, error: 'Essa categoria já existe' }
      setCategories((prev) => prev.map((c) => (c === oldName ? n : c)))
      return { ok: true }
    },
    [categories],
  )

  const remove = useCallback((name: string) => {
    setCategories((prev) => prev.filter((c) => c !== name))
  }, [])

  return { categories, ensure, add, rename, remove }
}
