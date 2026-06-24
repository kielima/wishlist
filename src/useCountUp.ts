import { useEffect, useRef, useState } from 'react'

/**
 * Anima um valor de 0 a 1 (ease-out cúbico). Reinicia quando `trigger` muda.
 * Tem um fallback por timeout para nunca ficar preso em 0 se o
 * requestAnimationFrame for estrangulado (aba em segundo plano).
 */
export function useCountUp(trigger: unknown, durationMs = 750): number {
  const [t, setT] = useState(0)
  const raf = useRef<number | undefined>(undefined)

  useEffect(() => {
    setT(0)
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs)
      setT(1 - Math.pow(1 - p, 3))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    const fallback = setTimeout(() => setT(1), durationMs + 80)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
      clearTimeout(fallback)
    }
  }, [trigger, durationMs])

  return t
}
