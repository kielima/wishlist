import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'
import { supabase } from './supabase'

/** Sessão atual do Supabase, observada em tempo real. */
export function useSession(): { session: Session | null; loading: boolean } {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return { session, loading }
}

/** Envia o link mágico para o e-mail. O retorno volta para a própria URL do app. */
export async function signInWithEmail(email: string): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado')
  const redirectTo = window.location.origin + import.meta.env.BASE_URL
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  })
  if (error) throw error
}

/**
 * Verifica o código de 6 dígitos enviado por e-mail e cria a sessão no contexto
 * atual (essencial para PWA: o link mágico abre no navegador, mas o código pode
 * ser digitado dentro do próprio app instalado).
 */
export async function verifyOtpCode(email: string, token: string): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado')
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
  if (error) throw error
}

// Login com Google. No navegador é o fluxo OAuth normal do Supabase; dentro do
// WebView do APK o popup não devolve o resultado e o fluxo travaria, então lá
// usamos o Google Sign-In NATIVO do Android via
// @capacitor-firebase/authentication com `skipNativeAuth: true` (ver
// capacitor.config.ts): o plugin só abre o seletor de contas e devolve um
// idToken genuíno do Google, que entregamos direto ao Supabase.
//
// É o mesmo desenho do app-produtividade (src/lib/auth.ts), e resolve o
// problema que o código OTP resolvia: não depende de link de e-mail voltar
// para dentro do app, o que WebView e PWA instalado não conseguem fazer.
//
// A dependência `firebase` fica no package.json só porque o bundle WEB do
// plugin importa `firebase/auth` estaticamente. Por isso o import do plugin é
// DINÂMICO e só acontece no ramo nativo: importado no topo, ele arrastaria
// ~210 KiB de SDK do Firebase para dentro do bundle web, que nunca os executa.
export async function signInWithGoogle(): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado')

  if (Capacitor.isNativePlatform()) {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
    const result = await FirebaseAuthentication.signInWithGoogle()
    const idToken = result.credential?.idToken
    if (!idToken) throw new Error('Login nativo do Google não retornou idToken.')
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })
    if (error) throw error
    return
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + import.meta.env.BASE_URL },
  })
  if (error) throw error
}

/** True quando o usuário cancelou o seletor de contas — não é erro a reportar. */
export function isCancelledByUser(e: unknown): boolean {
  if (typeof e !== 'object' || e === null) return false
  const message = (e as { message?: string }).message ?? ''
  const code = (e as { code?: string }).code
  return /popup|cancel/i.test(message) || code === '12501' || code === 'sign_in_canceled'
}

export async function signOut(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    // Encerra também a sessão nativa do Google, senão o próximo login reusa a
    // conta anterior sem perguntar.
    await import('@capacitor-firebase/authentication')
      .then(({ FirebaseAuthentication }) => FirebaseAuthentication.signOut())
      .catch(() => {})
  }
  if (!supabase) return
  await supabase.auth.signOut()
}
