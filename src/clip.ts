import { supabase } from './supabase'
import { scrapeViaNativeBrowser } from './nativeClip'

/** Valores que pré-preenchem o formulário "Novo desejo" ao clipar. */
export interface ClipPrefill {
  name?: string
  priceReais?: string
  link?: string
  photo?: string
  /** Imagens candidatas detectadas na página, para o usuário escolher. */
  photos?: string[]
}

function parseList(s?: string): string[] {
  if (!s) return []
  try {
    const arr = JSON.parse(s)
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

function dedupe(list: (string | undefined | null)[]): string[] {
  const out: string[] = []
  for (const x of list) if (x && !out.includes(x)) out.push(x)
  return out
}

const KEY = 'wishlist:pendingClip'

interface RawClip {
  // vindo da extensão (já com os dados extraídos da página)
  name?: string
  price?: string
  image?: string
  /** JSON com a lista de imagens candidatas. */
  images?: string
  link?: string
  // vindo do Compartilhar (só a URL/título)
  url?: string
  title?: string
  text?: string
}

function firstUrl(s?: string): string | undefined {
  if (!s) return undefined
  const m = s.match(/https?:\/\/[^\s]+/i)
  return m ? m[0] : undefined
}

/**
 * Lê os parâmetros de clip da URL atual (extensão ou Compartilhar), guarda em
 * sessionStorage e limpa a URL. Chamar bem cedo, antes de renderizar — assim o
 * clip sobrevive a um eventual redirect de login.
 */
export function stashIncomingClip(): void {
  if (typeof window === 'undefined') return
  const p = new URLSearchParams(window.location.search)
  const has = ['clip', 'url', 'title', 'text', 'link', 'name'].some((k) => p.has(k))
  if (!has) return

  const raw: RawClip = {
    name: p.get('name') ?? undefined,
    price: p.get('price') ?? undefined,
    image: p.get('image') ?? undefined,
    images: p.get('images') ?? undefined,
    link: p.get('link') ?? undefined,
    url: p.get('url') ?? undefined,
    title: p.get('title') ?? undefined,
    text: p.get('text') ?? undefined,
  }
  try {
    sessionStorage.setItem(KEY, JSON.stringify(raw))
  } catch {
    /* ignore */
  }
  // Remove os parâmetros da barra de endereço.
  window.history.replaceState({}, '', window.location.pathname)
}

/** Retira (e apaga) o clip pendente guardado, se houver. */
export function takePendingClip(): RawClip | null {
  try {
    const v = sessionStorage.getItem(KEY)
    if (!v) return null
    sessionStorage.removeItem(KEY)
    return JSON.parse(v) as RawClip
  } catch {
    return null
  }
}

/**
 * Transforma um clip cru em valores de formulário. Se só veio a URL
 * (Compartilhar), chama a Edge Function `clip` para extrair os metadados.
 */
export async function resolveClip(raw: RawClip): Promise<ClipPrefill> {
  // Caso 1: extensão já mandou tudo.
  if (raw.name || raw.image || raw.images || (raw.link && !raw.url)) {
    const photos = dedupe([...parseList(raw.images), raw.image])
    return {
      name: raw.name,
      priceReais: raw.price ? String(Math.round(parseFloat(raw.price))) : undefined,
      link: raw.link,
      photo: photos[0],
      photos,
    }
  }

  const url = raw.url || firstUrl(raw.text) || firstUrl(raw.link)
  if (!url) return { name: raw.title }

  // Caso 2: app Android (não o navegador) — abre a URL num WebView interno
  // OCULTO e extrai os dados no aparelho do usuário, igual a extensão de
  // desktop faria. Funciona mesmo em lojas que bloqueiam a Edge Function por
  // reputação de IP (ex.: Mercado Livre): aqui quem busca a página é o
  // celular do usuário, não o datacenter da função. No navegador comum
  // (PWA), isNativePlatform() é falso e isso vira um no-op imediato.
  const native = await scrapeViaNativeBrowser(url)
  if (native && (native.name || native.images?.length)) {
    const photos = dedupe(native.images ?? [])
    return {
      name: native.name || raw.title,
      priceReais: native.price ? String(Math.round(parseFloat(native.price))) : undefined,
      link: native.link || url,
      photo: photos[0],
      photos,
    }
  }

  // Caso 3: Compartilhar pelo navegador — só temos a URL; extrai no servidor.
  if (!supabase) return { name: raw.title, link: url }

  try {
    const { data, error } = await supabase.functions.invoke('clip', { body: { url } })
    if (error || !data) return { name: raw.title, link: url }
    const photos = dedupe([...(Array.isArray(data.images) ? data.images : []), data.image])
    return {
      name: data.name || raw.title,
      priceReais: data.price != null ? String(Math.round(Number(data.price))) : undefined,
      link: data.link || url,
      photo: photos[0],
      photos,
    }
  } catch {
    return { name: raw.title, link: url }
  }
}
