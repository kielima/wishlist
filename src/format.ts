import { PRIORITY_META } from './constants'
import type { WishItem } from './types'

/** Formata centavos como "R$ 1.299" (sem casas decimais, padrão pt-BR). */
export function formatPrice(cents: number | null): string {
  const value = Math.round((cents ?? 0) / 100)
  return 'R$ ' + value.toLocaleString('pt-BR')
}

/** Primeira letra do nome, em maiúscula — usada no placeholder do thumbnail. */
export function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}

/** Categoria principal (a primeira) ou "Outros". */
export function primaryCategory(item: WishItem): string {
  return item.categories[0] || 'Outros'
}

/** Ordena por status (desejados antes de comprados) e depois por prioridade. */
export function sortItems(items: WishItem[]): WishItem[] {
  return [...items].sort((a, b) => {
    if ((a.status === 'bought') !== (b.status === 'bought')) {
      return a.status === 'bought' ? 1 : -1
    }
    return PRIORITY_META[a.priority].rank - PRIORITY_META[b.priority].rank
  })
}

/** Domínio limpo do link (sem protocolo) para exibição. */
export function linkDomain(link: string): string {
  return link.replace(/^https?:\/\//, '').replace(/\/$/, '') || '—'
}

/** Href navegável a partir de um link sem protocolo. */
export function linkHref(link: string): string {
  if (!link) return '#'
  return /^https?:\/\//.test(link) ? link : 'https://' + link
}

/** Lê um File como data URL (base64). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
