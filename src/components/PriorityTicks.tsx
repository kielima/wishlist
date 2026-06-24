import { PRIORITY_META } from '../constants'
import type { Priority } from '../types'

interface Props {
  priority: Priority
  /** Largura de cada traço (px) ou 'flex' para preencher igualmente. */
  w?: number | 'flex'
  h?: number
  gap?: number
  active?: string
  inactive?: string
  radius?: number
}

/** Os 4 tracinhos do medidor MoSCoW, preenchidos conforme a prioridade. */
export default function PriorityTicks({
  priority,
  w = 6,
  h = 12,
  gap = 3,
  active = '#0a0a0a',
  inactive = '#ececec',
  radius = 2,
}: Props) {
  const ticks = PRIORITY_META[priority].ticks
  return (
    <div style={{ display: 'flex', gap, flex: w === 'flex' ? 1 : undefined }}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            width: w === 'flex' ? undefined : w,
            flex: w === 'flex' ? 1 : undefined,
            height: h,
            borderRadius: radius,
            background: i < ticks ? active : inactive,
          }}
        />
      ))}
    </div>
  )
}
