import { useEffect, useState } from 'react'

export interface Viewport {
  width: number
  /** < 760: layout mobile (topbar + lista compacta). */
  isNarrow: boolean
  /** >= 760: layout desktop com sidebar e tabela. */
  hasSidebar: boolean
  /** >= 1180: o painel Resumo pode ficar fixo, empurrando o conteúdo. */
  isWide: boolean
}

/** Acompanha a largura da janela e deriva os breakpoints do layout. */
export function useViewport(): Viewport {
  const [width, setWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1280))

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return {
    width,
    isNarrow: width < 760,
    hasSidebar: width >= 760,
    isWide: width >= 1180,
  }
}
