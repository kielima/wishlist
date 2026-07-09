import { Capacitor } from '@capacitor/core'
import { InAppBrowser } from '@capgo/capacitor-inappbrowser'

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform()
}

export interface NativeScrapeResult {
  name?: string | null
  images?: string[]
  price?: string | null
  link?: string
}

/**
 * Roda INJETADA na página de destino (não aqui) — mesma extração de
 * extension/background.js, adaptada para mandar o resultado de volta via
 * `window.mobileApp.postMessage` em vez de retornar um valor.
 */
function scrapeProductInPage(): void {
  const metaContent = (selector: string) => {
    const el = document.querySelector(selector)
    return el ? el.getAttribute('content') : null
  }

  let name: string | null = null
  let metaImage: string | null = null
  let price: string | null = null

  for (const script of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
    try {
      const data = JSON.parse(script.textContent || '')
      const nodes = Array.isArray(data) ? data : data['@graph'] || [data]
      for (const item of nodes) {
        const type = item && item['@type']
        const isProduct = type === 'Product' || (Array.isArray(type) && type.includes('Product'))
        if (!isProduct) continue
        if (!name && item.name) name = item.name
        if (!metaImage) metaImage = typeof item.image === 'string' ? item.image : Array.isArray(item.image) ? item.image[0] : null
        let offer = item.offers
        offer = Array.isArray(offer) ? offer[0] : offer
        if (offer && price == null) {
          const p = offer.price != null ? offer.price : offer.lowPrice
          if (p != null) price = p
        }
      }
    } catch {
      /* ignora JSON-LD inválido */
    }
  }

  name = name || metaContent('meta[property="og:title"]') || document.title
  metaImage = metaImage || metaContent('meta[property="og:image"]') || metaContent('meta[name="twitter:image"]')
  if (price == null) {
    price = metaContent('meta[property="product:price:amount"]') || metaContent('meta[property="og:price:amount"]')
  }

  const visible: { src: string; area: number }[] = []
  for (const img of Array.from(document.images)) {
    const src = img.currentSrc || img.src
    if (!src || !/^https?:/i.test(src)) continue
    const rect = img.getBoundingClientRect()
    if (rect.width < 200 || rect.height < 200) continue
    visible.push({ src, area: rect.width * rect.height })
  }
  visible.sort((a, b) => b.area - a.area)

  const images: string[] = []
  for (const v of visible) if (!images.includes(v.src)) images.push(v.src)
  if (metaImage && !images.includes(metaImage)) images.push(metaImage)

  ;(window as unknown as { mobileApp: { postMessage: (m: unknown) => void } }).mobileApp.postMessage({
    name,
    images: images.slice(0, 8),
    price: price != null ? String(price) : null,
    link: location.href,
  })
}

/**
 * Abre a URL num WebView interno OCULTO — mesmo mecanismo da extensão de
 * desktop (ler a página com o JS da própria página), só que embutido no app.
 * Funciona mesmo em lojas que bloqueiam a Edge Function por reputação de IP
 * (ex.: Mercado Livre): aqui a requisição sai do aparelho do usuário, como um
 * navegador de verdade — não do datacenter da função.
 *
 * Assume no máximo uma chamada em andamento por vez (o app não dispara scrapes
 * concorrentes), então não filtra eventos por id de webview.
 */
export async function scrapeViaNativeBrowser(url: string, timeoutMs = 15000): Promise<NativeScrapeResult | null> {
  if (!isNativePlatform()) return null

  return new Promise((resolve) => {
    let settled = false
    let webviewId: string | undefined

    const finish = (result: NativeScrapeResult | null) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      void msgHandle.then((h) => h.remove())
      void loadHandle.then((h) => h.remove())
      if (webviewId) void InAppBrowser.close({ id: webviewId }).catch(() => {})
      resolve(result)
    }

    const timer = setTimeout(() => finish(null), timeoutMs)

    const msgHandle = InAppBrowser.addListener('messageFromWebview', (event) => {
      finish((event.detail as NativeScrapeResult) ?? null)
    })

    const loadHandle = InAppBrowser.addListener('browserPageLoaded', (event) => {
      void InAppBrowser.executeScript({
        id: event.id,
        code: `(${scrapeProductInPage.toString()})()`,
      }).catch(() => finish(null))
    })

    InAppBrowser.openWebView({ url, hidden: true })
      .then(({ id }) => {
        webviewId = id
      })
      .catch(() => finish(null))
  })
}
