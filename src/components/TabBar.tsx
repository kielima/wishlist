import { BarsIcon, ListIcon, PlusIcon } from './Icons'

interface Props {
  active: 'home' | 'stats'
  onHome: () => void
  onStats: () => void
  onNew: () => void
}

const tabBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 5,
  padding: '4px 14px',
}

const label: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  fontFamily: 'var(--font-body)',
}

export default function TabBar({ active, onHome, onStats, onNew }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '11px 30px calc(26px + env(safe-area-inset-bottom))',
        borderTop: '1px solid #f0f0f0',
        background: '#ffffff',
      }}
    >
      <button style={{ ...tabBtn, color: active === 'home' ? '#0a0a0a' : '#bdbdbd' }} onClick={onHome}>
        <ListIcon />
        <span style={label}>Lista</span>
      </button>
      <button
        className="press-lg"
        onClick={onNew}
        style={{
          background: '#0a0a0a',
          border: 'none',
          cursor: 'pointer',
          width: 52,
          height: 52,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 18px rgba(0,0,0,.22)',
          marginTop: -4,
        }}
      >
        <PlusIcon />
      </button>
      <button style={{ ...tabBtn, color: active === 'stats' ? '#0a0a0a' : '#bdbdbd' }} onClick={onStats}>
        <BarsIcon />
        <span style={label}>Resumo</span>
      </button>
    </div>
  )
}
