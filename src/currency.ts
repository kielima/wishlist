import { createContext, useContext, useEffect, useState } from 'react'
import type { Currency } from './types'

export interface CurrencyMeta {
  code: Currency
  /** Símbolo curto exibido junto ao valor ("US$"). */
  symbol: string
  /** Nome em pt-BR. */
  label: string
}

/** Moedas suportadas (a primeira, BRL, é o padrão). */
export const CURRENCIES: CurrencyMeta[] = [
  { code: 'BRL', symbol: 'R$', label: 'Real' },
  { code: 'USD', symbol: 'US$', label: 'Dólar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'CNY', symbol: '¥', label: 'Yuan' },
]

export const CURRENCY_META = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c]),
) as Record<Currency, CurrencyMeta>

/** Cotação: quantos reais vale 1 unidade de cada moeda. */
export type Rates = Record<Currency, number>

/**
 * Cotações recentes de referência, usadas como fallback quando não há rede
 * (o app é offline-first) ou antes da primeira atualização. Atualize a data
 * ao revisar os valores. Última revisão: junho/2026.
 */
export const FALLBACK_RATES: Rates = { BRL: 1, USD: 5.42, EUR: 5.83, CNY: 0.75 }

const CACHE_KEY = 'wishlist.rates.v1'
/** Reusa o cache por 12h antes de buscar de novo. */
const MAX_AGE_MS = 12 * 60 * 60 * 1000

interface CachedRates {
  rates: Rates
  fetchedAt: number
}

function readCache(): CachedRates | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as CachedRates) : null
  } catch {
    return null
  }
}

/**
 * Busca cotações recentes de uma API pública gratuita (sem chave). A base é BRL
 * e os valores retornados são "moeda por 1 real", então invertemos para obter
 * "reais por 1 unidade da moeda". Retorna null em qualquer falha.
 */
async function fetchRates(): Promise<Rates | null> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/BRL')
    if (!res.ok) return null
    const data = await res.json()
    const r = data?.rates
    if (!r) return null
    const inv = (code: Currency) => (r[code] ? 1 / r[code] : FALLBACK_RATES[code])
    return { BRL: 1, USD: inv('USD'), EUR: inv('EUR'), CNY: inv('CNY') }
  } catch {
    return null
  }
}

/**
 * Hook que mantém as cotações atualizadas. Começa pelo cache local (ou pelo
 * fallback) e busca valores recentes em segundo plano. Usado uma vez no topo
 * do app; o valor é distribuído via RatesContext.
 */
export function useLiveRates(): Rates {
  const [rates, setRates] = useState<Rates>(() => readCache()?.rates ?? FALLBACK_RATES)

  useEffect(() => {
    const cached = readCache()
    if (cached && Date.now() - cached.fetchedAt < MAX_AGE_MS) return
    let active = true
    fetchRates().then((fresh) => {
      if (!fresh || !active) return
      setRates(fresh)
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ rates: fresh, fetchedAt: Date.now() }))
      } catch {
        /* armazenamento indisponível — segue com o valor em memória */
      }
    })
    return () => {
      active = false
    }
  }, [])

  return rates
}

export const RatesContext = createContext<Rates>(FALLBACK_RATES)

/** Cotações atuais, lidas do contexto. Use nos componentes de exibição. */
export function useRates(): Rates {
  return useContext(RatesContext)
}

/** Converte um valor (em centavos da moeda informada) para centavos em BRL. */
export function toBRLCents(cents: number | null, currency: Currency, rates: Rates): number {
  if (!cents) return 0
  return Math.round(cents * (rates[currency] ?? 1))
}

/** Formata um valor (centavos) na própria moeda, ex.: "US$ 28" (padrão pt-BR). */
export function formatMoney(cents: number | null, currency: Currency): string {
  const value = Math.round((cents ?? 0) / 100)
  return CURRENCY_META[currency].symbol + ' ' + value.toLocaleString('pt-BR')
}
