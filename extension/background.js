// Wishlist Clipper — extensão de navegador (desktop).
// Ao clicar no ícone, lê os metadados do produto na aba atual e abre a Wishlist
// com o formulário "Novo desejo" já preenchido.

const APP_URL = 'https://kielima.github.io/wishlist/'

/** Executa NO CONTEXTO DA PÁGINA: extrai nome, imagem e preço do produto. */
function scrapeProduct() {
  const metaContent = (selector) => {
    const el = document.querySelector(selector)
    return el ? el.getAttribute('content') : null
  }

  let name = null
  let metaImage = null
  let price = null

  // 1) JSON-LD (schema.org Product) — fonte mais confiável de preço.
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const data = JSON.parse(script.textContent)
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

  // 2) Open Graph / Twitter como fallback de título/imagem/preço.
  name = name || metaContent('meta[property="og:title"]') || document.title
  metaImage = metaImage || metaContent('meta[property="og:image"]') || metaContent('meta[name="twitter:image"]')
  if (price == null) {
    price = metaContent('meta[property="product:price:amount"]') || metaContent('meta[property="og:price:amount"]')
  }

  // 3) Imagens VISÍVEIS na tela: coleta as <img> grandes, ordenadas pela área.
  // Assim o usuário pode escolher (resolve cores/variantes e ângulos), e a maior
  // visível vira a sugestão padrão — não o og:image, que costuma ser fixo.
  const visible = []
  for (const img of document.images) {
    const src = img.currentSrc || img.src
    if (!src || !/^https?:/i.test(src)) continue
    const rect = img.getBoundingClientRect()
    if (rect.width < 200 || rect.height < 200) continue
    visible.push({ src, area: rect.width * rect.height })
  }
  visible.sort((a, b) => b.area - a.area)

  const images = []
  for (const v of visible) if (!images.includes(v.src)) images.push(v.src)
  if (metaImage && !images.includes(metaImage)) images.push(metaImage)

  return { name, images: images.slice(0, 8), price: price != null ? String(price) : null, link: location.href }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return

  let result = { link: tab.url }
  try {
    const [r] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: scrapeProduct })
    if (r && r.result) result = r.result
  } catch {
    /* página sem permissão (ex.: chrome://) — abre só com o link */
  }

  const params = new URLSearchParams({ clip: '1' })
  if (result.name) params.set('name', result.name)
  if (result.images && result.images.length) {
    params.set('image', result.images[0])
    params.set('images', JSON.stringify(result.images))
  } else if (result.image) {
    params.set('image', result.image)
  }
  if (result.price) params.set('price', result.price)
  if (result.link) params.set('link', result.link)

  chrome.tabs.create({ url: APP_URL + '?' + params.toString() })
})
