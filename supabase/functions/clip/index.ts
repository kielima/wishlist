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
function fromJsonLd(html: string): { name?: string; images: string[]; price?: number; currency?: string } {
  const out: { name?: string; images: string[]; price?: number; currency?: string } = { images: [] }
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
        const imgs = typeof img === 'string' ? [img] : Array.isArray(img) ? (img as string[]) : []
        for (const u of imgs) if (typeof u === 'string' && !out.images.includes(u)) out.images.push(u)
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

/**
 * Imagens de produto da Amazon. As páginas da Amazon não têm `og:image` — a
 * galeria fica num blob JS. Pegamos, em ordem de preferência: o `"hiRes"` da
 * galeria, o mapa `data-a-dynamic-image` da imagem principal e, por fim, o
 * `"large"`. Os padrões são específicos da Amazon, então é seguro usar como
 * fallback genérico (não casa em outras lojas).
 */
function fromAmazon(html: string): string[] {
  const out: string[] = []
  const add = (u?: string | null) => {
    if (u && u !== 'null' && /^https:\/\//.test(u) && !out.includes(u)) out.push(u)
  }

  for (const m of html.matchAll(/"hiRes":"(https:\/\/[^"]+)"/g)) add(m[1])

  if (!out.length) {
    const m = html.match(/data-a-dynamic-image=["']([^"']+)["']/)
    if (m) {
      try {
        for (const u of Object.keys(JSON.parse(decode(m[1])))) add(u)
      } catch {
        /* ignore */
      }
    }
  }

  if (!out.length) for (const m of html.matchAll(/"large":"(https:\/\/[^"]+)"/g)) add(m[1])

  return out
}

// UA de navegador: a maioria das lojas responde bem a um cliente "normal".
const BROWSER_UA = 'Mozilla/5.0 (compatible; WishlistClipper/1.0; +https://kielima.github.io/wishlist/)'

// UA de crawler social: algumas lojas (notadamente a Shopee) só renderizam os
// metadados no servidor — as og:tags — quando reconhecem um bot de preview de
// link. Com um UA comum a Shopee devolve apenas a casca do SPA (sem nome, sem
// imagem), e nada é extraído.
//
// Usamos o UA do WhatsApp de propósito: a Shopee bloqueia com HTTP 403 os UAs
// de crawler que exigem verificação por IP/reverse-DNS (Twitterbot, Googlebot,
// bingbot) quando a requisição vem de um IP de datacenter — que é o caso do
// egress desta Edge Function. O UA do WhatsApp não passa por essa verificação e
// devolve og:title + og:image (a foto real do produto). O preço, porém, só
// aparece no JSON-LD servido ao Twitterbot, então em links da Shopee o preço
// não é extraído server-side (o usuário digita — ele está visível na tela).
const CRAWLER_UA = 'WhatsApp/2.23.20.0'

/** Hosts que escondem os metadados atrás de um UA de crawler conhecido. */
function needsCrawlerUA(url: string): boolean {
  try {
    const h = new URL(url).hostname
    return /(^|\.)shopee\.|(^|\.)shp\.ee$/i.test(h)
  } catch {
    return false
  }
}

/**
 * Busca uma URL seguindo os redirects manualmente e mantendo um cookie jar.
 *
 * Algumas lojas (notadamente o AliExpress) protegem a página com uma dança de
 * cookies: o primeiro acesso devolve 302 para uma página `sync_cookie_*` que
 * grava cookies e só então redireciona de volta ao produto. O `fetch` do Deno
 * segue os 302 mas NÃO reenvia os `Set-Cookie` recebidos no caminho, então
 * caía na casca vazia (og:image em branco) e nenhuma foto era extraída.
 * Aqui acumulamos os cookies a cada salto e os reenviamos no próximo.
 */
async function fetchWithCookies(startUrl: string, ua = BROWSER_UA, maxHops = 10): Promise<string> {
  const jar = new Map<string, string>()
  let url = startUrl

  for (let hop = 0; hop < maxHops; hop++) {
    const cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ')
    const res = await fetch(url, {
      headers: {
        'User-Agent': ua,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        ...(cookie ? { Cookie: cookie } : {}),
      },
      redirect: 'manual',
    })

    // Acumula os cookies devolvidos neste salto.
    for (const sc of res.headers.getSetCookie()) {
      const pair = sc.split(';', 1)[0]
      const eq = pair.indexOf('=')
      if (eq <= 0) continue
      const name = pair.slice(0, eq).trim()
      const value = pair.slice(eq + 1).trim()
      if (value) jar.set(name, value)
      else jar.delete(name)
    }

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      await res.body?.cancel()
      if (!loc) break
      url = new URL(loc, url).toString()
      continue
    }

    return await res.text()
  }

  // Esgotou os saltos: faz uma última tentativa com o jar montado.
  const cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ')
  const res = await fetch(url, {
    headers: {
      'User-Agent': ua,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    redirect: 'follow',
  })
  return await res.text()
}

/** Extrai os metadados de produto de um HTML já buscado. */
function extract(html: string) {
  const ld = fromJsonLd(html)
  // A Shopee sufixa o og:title com " | Shopee Brasil"; remove esse ruído.
  const name = (ld.name || meta(html, 'og:title') || titleTag(html) || '')
    .replace(/\s*\|\s*Shopee(?:\s+Brasil)?\s*$/i, '')
    .trim()
  const ogImage = meta(html, 'og:image')
  const twImage = meta(html, 'twitter:image')
  const images: string[] = []
  for (const u of [...ld.images, ogImage, twImage]) if (u && !images.includes(u)) images.push(u)
  // Amazon não expõe og:image; cai no blob de imagens da galeria.
  if (!images.length) for (const u of fromAmazon(html)) images.push(u)
  const price = ld.price ?? parsePriceMeta(html)
  const currency = ld.currency || meta(html, 'og:price:currency') || null
  return { name, image: images[0] ?? null, images, price, currency }
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

    // Lojas como a Shopee só entregam os metadados a um UA de crawler; para
    // essas já começamos com o UA de crawler em vez do de navegador.
    const primaryUA = needsCrawlerUA(url) ? CRAWLER_UA : BROWSER_UA

    // O AliExpress às vezes responde com a casca vazia (sem nome nem imagem)
    // mesmo após a dança de cookies. Quando isso acontece, repetir a busca
    // com um cookie jar novo normalmente resolve — tentamos até 3 vezes.
    let result = { name: '', image: null as string | null, images: [] as string[], price: null as number | null, currency: null as string | null }
    for (let attempt = 0; attempt < 3; attempt++) {
      const html = await fetchWithCookies(url, primaryUA)
      result = extract(html)
      if (result.name || result.image) break // conseguiu algo útil
    }

    // Último recurso: se nada foi extraído e ainda não tentamos como crawler,
    // repete uma vez com o UA de crawler. Isso destrava o SSR de lojas que
    // escondem os metadados de clientes comuns sem prejudicar as demais.
    if (!result.name && !result.image && primaryUA !== CRAWLER_UA) {
      const html = await fetchWithCookies(url, CRAWLER_UA)
      result = extract(html)
    }

    return json({ ...result, link: url })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
