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
  ['amzn', 'Amazon'],
  ['mercadolivre', 'Mercado Livre'],
  ['mercadolibre', 'Mercado Livre'],
  ['shopee', 'Shopee'],
  ['shp.ee', 'Shopee'],
  ['aliexpress', 'AliExpress'],
  ['shein', 'Shein'],
  ['temu', 'Temu'],
  ['tiktok', 'TikTok'],
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

/** Domínios curtos demais para casar por substring com segurança (ex: "a.co" apareceria dentro de "banana.com"). */
const EXACT_SHORT_DOMAINS: [string, string][] = [['a.co', 'Amazon']]

/** Rótulos de sufixo (TLD) que, precedidos de um "genérico" (com/net/co…), formam um sufixo de 2 partes (com.br, co.uk…). */
const GENERIC_TLD_LABELS = new Set(['com', 'net', 'org', 'co', 'gov', 'edu'])

/**
 * Extrai o rótulo "principal" do domínio, ignorando subdomínios (ex: "s.", "vt.")
 * e sufixos de país de 2 partes (ex: "com.br"), sem depender de uma lista fixa de TLDs.
 */
function coreDomainLabel(domain: string): string {
  const labels = domain.split('.').filter(Boolean)
  if (labels.length <= 2) return labels[0] ?? ''
  const last = labels[labels.length - 1]
  const secondLast = labels[labels.length - 2]
  if (/^[a-z]{2}$/.test(last) && GENERIC_TLD_LABELS.has(secondLast)) {
    return labels[labels.length - 3] ?? secondLast
  }
  return secondLast
}

/** Nome amigável da loja a partir do link do item, ou null sem link identificável. */
export function storeName(link: string): string | null {
  if (!link) return null
  const domain = linkDomain(link).toLowerCase()
  if (!domain || domain === '—') return null
  const exact = EXACT_SHORT_DOMAINS.find(([host]) => domain === host || domain.endsWith('.' + host))
  if (exact) return exact[1]
  const known = STORE_NAMES.find(([key]) => domain.includes(key))
  if (known) return known[1]
  const bare = coreDomainLabel(domain)
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
