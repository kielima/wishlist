import { CheckIcon } from './Icons'

/** Toast efêmero no rodapé. A key força reanimar a cada nova mensagem. */
export default function Toast({ message }: { message: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 32,
        zIndex: 80,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: '#0a0a0a',
        borderRadius: 999,
        padding: '11px 18px',
        boxShadow: '0 8px 24px rgba(0,0,0,.25)',
        animation: 'toastIn 1.6s ease forwards',
        pointerEvents: 'none',
      }}
    >
      <CheckIcon size={13} stroke={1.8} />
      <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)' }}>{message}</span>
    </div>
  )
}
