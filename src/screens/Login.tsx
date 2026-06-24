import { useState } from 'react'
import { signInWithEmail } from '../auth'

const display = 'var(--font-display)'
const mono = 'var(--font-mono)'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    setError(null)
    try {
      await signInWithEmail(email.trim())
      setSent(true)
    } catch {
      setError('Não consegui enviar o link. Confira o e-mail e tente de novo.')
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
            Mandei um link mágico para <b>{email}</b>. Toque nele para entrar — abre direto no app.
          </div>
          <button
            onClick={() => setSent(false)}
            style={{ marginTop: 18, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#9a9a9a', padding: 0 }}
          >
            Usar outro e-mail
          </button>
        </div>
      ) : (
        <form onSubmit={submit} style={{ marginTop: 28 }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.1em', color: '#a3a3a3', textTransform: 'uppercase', marginBottom: 8 }}>E-mail</div>
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
    </div>
  )
}
