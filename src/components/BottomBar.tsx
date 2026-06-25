import { BarsIcon, ListIcon, PlusIcon } from './Icons'

interface Props {
  onHome: () => void
  onNew: () => void
  onOpenPanel: () => void
}

const body = 'var(--font-body)'

/** Barra de navegação inferior do mobile: Lista · (+) · Resumo. */
export default function BottomBar({ onHome, onNew, onOpenPanel }: Props) {
  const tab: React.CSSProperties = {
    flex: 1,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    fontFamily: body,
    fontSize: 11,
    fontWeight: 600,
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        background: '#fff',
        borderTop: '1px solid #f0f0f0',
        padding: '11px 28px calc(env(safe-area-inset-bottom) + 11px)',
      }}
    >
      <button onClick={onHome} style={{ ...tab, color: '#0a0a0a' }}>
        <ListIcon color="#0a0a0a" />
        Lista
      </button>

      <div style={{ flexShrink: 0, width: 64, display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={onNew}
          aria-label="Novo desejo"
          style={{
            width: 56,
            height: 56,
            marginTop: -30,
            borderRadius: '50%',
            background: '#0a0a0a',
            border: '3px solid #fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 18px rgba(0,0,0,.28)',
          }}
        >
          <PlusIcon />
        </button>
      </div>

      <button onClick={onOpenPanel} style={{ ...tab, color: '#9a9a9a' }}>
        <BarsIcon color="#9a9a9a" />
        Resumo
      </button>
    </div>
  )
}
