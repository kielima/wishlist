/** Ícones SVG do design, como componentes reutilizáveis. */

export function CheckIcon({ size = 11, color = '#fff', stroke = 1.7 }: { size?: number; color?: string; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11">
      <path d="M2 5.6l2.2 2.2L9 2.6" stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PlusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22">
      <path d="M11 4.5v13M4.5 11h13" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

export function ListIcon({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20">
      <rect x="2.5" y="4" width="15" height="2" rx="1" fill={color} />
      <rect x="2.5" y="9" width="15" height="2" rx="1" fill={color} />
      <rect x="2.5" y="14" width="10" height="2" rx="1" fill={color} />
    </svg>
  )
}

export function BarsIcon({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20">
      <rect x="3" y="11" width="3.4" height="6" rx="1" fill={color} />
      <rect x="8.3" y="6" width="3.4" height="11" rx="1" fill={color} />
      <rect x="13.6" y="3" width="3.4" height="14" rx="1" fill={color} />
    </svg>
  )
}

export function BackIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13">
      <path d="M8.5 2L3.5 6.5l5 4.5" stroke="#0a0a0a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function TrashIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17">
      <path d="M3.5 4.5h10M6.5 4.5V3h4v1.5M5 4.5l.7 9h5.6l.7-9" stroke="#9a9a9a" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ExternalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <path d="M5 11l6-6M6 4.5h5v5" stroke="#0a0a0a" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CameraIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26">
      <rect x="3" y="6" width="20" height="15" rx="2.5" stroke="#c4c4c4" strokeWidth="1.5" fill="none" />
      <circle cx="9.5" cy="11.5" r="1.8" fill="#c4c4c4" />
      <path d="M3.5 19l6-5 4 3 4-4 5 4.5" stroke="#c4c4c4" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function DocIcon({ w = 20, h = 24, color = '#9a9a9a' }: { w?: number; h?: number; color?: string }) {
  return (
    <svg width={w} height={h} viewBox="0 0 20 24">
      <rect x="2" y="2" width="16" height="20" rx="2.5" stroke={color} strokeWidth="1.4" fill="none" />
      <path d="M6 9.5h8M6 13.5h8M6 17.5h5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function CloseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13">
      <path d="M3 3l7 7M10 3l-7 7" stroke="#bdbdbd" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
