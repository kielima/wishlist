import { useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { isCancelledByUser, signInWithEmail, signInWithGoogle, verifyOtpCode } from '../auth'

const display = 'var(--font-display)'
const mono = 'var(--font-mono)'

// No APK o login por e-mail não se completa: o código OTP só existe se o
// template de e-mail do projeto Supabase for customizado, o que exige SMTP
// próprio — e o link, sozinho, não volta para dentro do WebView. Por isso, no
// nativo, oferecemos só o Google (que é nativo e não depende de e-mail).
// No navegador os dois caminhos funcionam.
const NATIVO = Capacitor.isNativePlatform()

export default function Login() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function entrarComGoogle() {
    setBusy(true)
    setError(null)
    try {
      await signInWithGoogle()
      // A sessão é criada; o App reage via onAuthStateChange e troca de tela.
    } catch (e) {
      if (!isCancelledByUser(e)) setError('Não consegui entrar com o Google. Tente de novo.')
    } finally {
      setBusy(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    setError(null)
    try {
      await signInWithEmail(email.trim())
      setSent(true)
    } catch (e) {
      const err = e as { status?: number; code?: string; message?: string }
      const rateLimited = err.status === 429 || err.code?.includes('rate') || /rate limit/i.test(err.message ?? '')
      setError(
        rateLimited
          ? 'Muitas tentativas. Aguarde alguns minutos e tente de novo (ou confira a caixa de spam — o link pode já ter chegado).'
          : 'Não consegui enviar o link. Confira o e-mail e tente de novo.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault()
    const token = code.trim()
    if (token.length < 6) return
    setBusy(true)
    setError(null)
    try {
      await verifyOtpCode(email.trim(), token)
      // A sessão é criada; o App reage via onAuthStateChange e troca de tela.
    } catch {
      setError('Código inválido ou expirado. Confira no e-mail e tente de novo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px', background: '#ffffff' }}>
      <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '.18em', color: '#a3a3a3', fontWeight: 500 }}>SUA LISTA</div>
      <div style={{ fontFamily: display, fontSize: 38, fontWeight: 700, color: '#0a0a0a', letterSpacing: '-.01em', lineHeight: 1, marginTop: 4 }}>Desejos</div>

      {sent ? (
        <div style={{ marginTop: 28, animation: 'popIn .3s ease both' }}>
          <div style={{ fontFamily: display, fontSize: 18, fontWeight: 600, color: '#0a0a0a' }}>Confira seu e-mail ✉️</div>
          <div style={{ fontSize: 14.5, color: '#6b6b6b', marginTop: 8, lineHeight: 1.5 }}>
            Mandei um e-mail para <b>{email}</b>. Digite aqui o <b>código</b> que está nele — assim você entra direto neste app.
          </div>

          <form onSubmit={verify} style={{ marginTop: 18 }}>
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.1em', color: '#a3a3a3', textTransform: 'uppercase', marginBottom: 8 }}>Código</div>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="00000000"
              style={{ width: '100%', boxSizing: 'border-box', border: 'none', borderBottom: '1.5px solid #ececec', background: 'none', padding: '8px 0', fontFamily: mono, fontSize: 24, fontWeight: 600, letterSpacing: '.2em', color: '#0a0a0a', outline: 'none' }}
            />
            {error && <div style={{ color: '#e2553d', fontSize: 13, marginTop: 10 }}>{error}</div>}
            <button
              type="submit"
              disabled={busy || code.length < 6}
              className="press"
              style={{ marginTop: 20, width: '100%', cursor: busy || code.length < 6 ? 'default' : 'pointer', borderRadius: 15, padding: 16, fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, background: '#0a0a0a', color: '#fff', border: 'none', opacity: busy || code.length < 6 ? 0.6 : 1 }}
            >
              {busy ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <div style={{ fontSize: 12.5, color: '#9a9a9a', marginTop: 14, lineHeight: 1.5 }}>
            No computador, você também pode só tocar no link do e-mail.
          </div>
          <button
            onClick={() => { setSent(false); setCode(''); setError(null) }}
            style={{ marginTop: 14, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#9a9a9a', padding: 0 }}
          >
            Usar outro e-mail
          </button>
        </div>
      ) : (
        <>
        <div style={{ marginTop: 28 }}>
          <button
            onClick={entrarComGoogle}
            disabled={busy}
            className="press"
            style={{ width: '100%', cursor: busy ? 'default' : 'pointer', borderRadius: 15, padding: 16, fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, background: '#0a0a0a', color: '#fff', border: 'none', opacity: busy ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.96H.96a9 9 0 0 0 0 8.08l3.01-2.32z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
            </svg>
            {busy ? 'Entrando…' : 'Entrar com Google'}
          </button>
          {error && <div style={{ color: '#e2553d', fontSize: 13, marginTop: 10 }}>{error}</div>}
          <div style={{ fontSize: 12.5, color: '#9a9a9a', marginTop: 14, lineHeight: 1.5 }}>
            {NATIVO
              ? 'Sem senha e sem e-mail: você escolhe a conta do Google e entra.'
              : 'Mesma conta usada no app de produtividade.'}
          </div>
        </div>

        {!NATIVO && (
        <form onSubmit={submit} style={{ marginTop: 28, borderTop: '1px solid #ececec', paddingTop: 24 }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.1em', color: '#a3a3a3', textTransform: 'uppercase', marginBottom: 8 }}>Ou por e-mail</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            autoComplete="email"
            style={{ width: '100%', boxSizing: 'border-box', border: 'none', borderBottom: '1.5px solid #ececec', background: 'none', padding: '8px 0', fontFamily: display, fontSize: 18, fontWeight: 600, color: '#0a0a0a', outline: 'none' }}
          />
          {error && <div style={{ color: '#e2553d', fontSize: 13, marginTop: 10 }}>{error}</div>}
          <button
            type="submit"
            disabled={busy}
            className="press"
            style={{ marginTop: 24, width: '100%', cursor: busy ? 'default' : 'pointer', borderRadius: 15, padding: 16, fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, background: '#0a0a0a', color: '#fff', border: 'none', opacity: busy ? 0.6 : 1 }}
          >
            {busy ? 'Enviando…' : 'Enviar link de acesso'}
          </button>
          <div style={{ fontSize: 12.5, color: '#9a9a9a', marginTop: 14, lineHeight: 1.5 }}>
            Sem senha. Você recebe um link no e-mail e entra com um toque.
          </div>
        </form>
        )}
        </>
      )}
    </div>
  )
}
