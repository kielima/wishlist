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

/** Domínio limpo do link (só o host) para exibição. */
export function linkDomain(link: string): string {
  if (!link) return '—'
  try {
    const host = new URL(linkHref(link)).hostname.replace(/^www\./, '')
    if (host) return host
  } catch {
    // cai no fallback abaixo
  }
  return link.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '') || '—'
}

/** Nomes amigáveis para domínios de lojas comuns, usados no agrupamento por loja. */
const STORE_NAMES: [string, string][] = [
  ['amazon', 'Amazon'],
  ['mercadolivre', 'Mercado Livre'],
  ['mercadolibre', 'Mercado Livre'],
  ['shopee', 'Shopee'],
  ['aliexpress', 'AliExpress'],
  ['shein', 'Shein'],
  ['temu', 'Temu'],
  ['magazineluiza', 'Magazine Luiza'],
  ['magalu', 'Magazine Luiza'],
  ['americanas', 'Americanas'],
  ['casasbahia', 'Casas Bahia'],
  ['pontofrio', 'Ponto Frio'],
  ['extra.com', 'Extra'],
  ['kabum', 'Kabum'],
  ['submarino', 'Submarino'],
  ['centauro', 'Centauro'],
  ['netshoes', 'Netshoes'],
  ['shoptime', 'Shoptime'],
  ['ebay', 'eBay'],
]

/** Nome amigável da loja a partir do link do item, ou null sem link identificável. */
export function storeName(link: string): string | null {
  if (!link) return null
  const domain = linkDomain(link).toLowerCase()
  if (!domain || domain === '—') return null
  const known = STORE_NAMES.find(([key]) => domain.includes(key))
  if (known) return known[1]
  const bare = domain.replace(/\.(com|net|org|shop|store|io)(\.br)?$/i, '').split('.')[0]
  return bare ? bare.charAt(0).toUpperCase() + bare.slice(1) : null
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
