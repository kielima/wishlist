// Edge Function "clip" — extrator de metadados de páginas de produto.
// Recebe uma URL, busca a página no servidor (driblando o CORS do navegador)
// e devolve { name, image, price, currency, link } em JSON.
//
// Usado pelo "Compartilhar" no celular. No desktop a extensão lê a página
// diretamente e nem chama esta função.

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

/** Conteúdo de uma <meta> por property OU name (ordem dos atributos livre). */
function meta(html: string, key: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${key}["']`, 'i'),
  ]
  for (const p of patterns) {
    const m = html.match(p)
    if (m) return decode(m[1])
  }
  return null
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

/** Procura um objeto Product nos blocos JSON-LD (schema.org). */
function fromJsonLd(html: string): { name?: string; image?: string; price?: number; currency?: string } {
  const out: { name?: string; image?: string; price?: number; currency?: string } = {}
  const blocks = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  for (const b of blocks) {
    let parsed: unknown
    try {
      parsed = JSON.parse(b[1].trim())
    } catch {
      continue
    }
    const nodes = Array.isArray(parsed) ? parsed : [parsed]
    for (const node of nodes) {
      const list = node && typeof node === 'object' && '@graph' in node ? (node as { '@graph': unknown[] })['@graph'] : [node]
      for (const item of list as Record<string, unknown>[]) {
        if (!item || typeof item !== 'object') continue
        const type = item['@type']
        const isProduct = type === 'Product' || (Array.isArray(type) && type.includes('Product'))
        if (!isProduct) continue
        if (typeof item.name === 'string' && !out.name) out.name = item.name
        const img = item.image
        if (!out.image) out.image = typeof img === 'string' ? img : Array.isArray(img) ? (img[0] as string) : undefined
        const offers = item.offers as Record<string, unknown> | Record<string, unknown>[] | undefined
        const offer = Array.isArray(offers) ? offers[0] : offers
        if (offer && typeof offer === 'object') {
          const price = (offer as Record<string, unknown>).price ?? (offer as Record<string, unknown>).lowPrice
          if (price != null && out.price == null) {
            const n = parseFloat(String(price))
            if (!Number.isNaN(n)) out.price = n
          }
          const cur = (offer as Record<string, unknown>).priceCurrency
          if (typeof cur === 'string' && !out.currency) out.currency = cur
        }
      }
    }
  }
  return out
}

function parsePriceMeta(html: string): number | null {
  const raw =
    meta(html, 'product:price:amount') ||
    meta(html, 'og:price:amount') ||
    meta(html, 'twitter:data1')
  if (!raw) return null
  // pega o primeiro número (lida com "R$ 1.299,90" e "1299.90")
  const cleaned = raw.replace(/[^\d.,]/g, '')
  if (!cleaned) return null
  let normalized = cleaned
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // formato pt-BR: 1.299,90 -> 1299.90
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else if (cleaned.includes(',')) {
    normalized = cleaned.replace(',', '.')
  }
  const n = parseFloat(normalized)
  return Number.isNaN(n) ? null : n
}

function titleTag(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return m ? decode(m[1]) : null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    let url: string | null = null
    if (req.method === 'GET') {
      url = new URL(req.url).searchParams.get('url')
    } else {
      const body = await req.json().catch(() => ({}))
      url = body?.url ?? null
    }
    if (!url) return json({ error: 'missing url' }, 400)
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WishlistClipper/1.0; +https://kielima.github.io/wishlist/)',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
    })
    const html = await res.text()

    const ld = fromJsonLd(html)
    const name = ld.name || meta(html, 'og:title') || titleTag(html) || ''
    const image = ld.image || meta(html, 'og:image') || meta(html, 'twitter:image') || null
    const price = ld.price ?? parsePriceMeta(html)
    const currency = ld.currency || meta(html, 'og:price:currency') || null

    return json({ name, image, price, currency, link: url })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
