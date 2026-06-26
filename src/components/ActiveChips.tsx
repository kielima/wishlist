export interface Chip {
  key: string
  label: string
  onRemove: () => void
}

/** Barra de chips dos filtros ativos, abaixo do cabeçalho. */
export default function ActiveChips({ chips, onClearAll }: { chips: Chip[]; onClearAll: () => void }) {
  if (chips.length === 0) return null
  return (
    <div data-scroll style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', padding: '12px 18px', borderBottom: '1px solid #f4f4f4' }}>
      {chips.map((ch) => (
        <button
          key={ch.key}
          onClick={ch.onRemove}
          className="soft-hover"
          style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, background: '#f4f4f4', border: 'none', cursor: 'pointer', borderRadius: 999, padding: '7px 11px 7px 13px', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, color: '#0a0a0a' }}
        >
          <span>{ch.label}</span>
          <svg width="9" height="9" viewBox="0 0 9 9">
            <path d="M1.5 1.5l6 6M7.5 1.5l-6 6" stroke="#9a9a9a" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      ))}
      <button onClick={onClearAll} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, color: '#9a9a9a', padding: '7px 6px', whiteSpace: 'nowrap' }}>
        Limpar tudo
      </button>
    </div>
  )
}
