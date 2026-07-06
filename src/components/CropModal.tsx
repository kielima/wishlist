import { useEffect, useRef, useState } from 'react'
import { Overlay } from './DetailModal'

const mono = 'var(--font-mono)'
const VP = 320
/** Resolução do lado maior da imagem exportada, em pixels. */
const OUT = 800

interface Props {
  /** Data URL (ou URL remota) da imagem a recortar. */
  src: string
  /** Proporção largura/altura do recorte final (1 = quadrado, como no modo galeria). */
  aspect?: number
  onCancel: () => void
  onConfirm: (croppedDataUrl: string) => void
}

/** Modal de recorte de foto: arrastar para posicionar, controle deslizante para zoom. */
export default function CropModal({ src, aspect = 1, onCancel, onConfirm }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)

  const vpW = VP
  const vpH = VP / aspect

  useEffect(() => {
    let cancelled = false
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => { if (!cancelled) setImg(image) }
    image.src = src
    return () => { cancelled = true }
  }, [src])

  if (!img) {
    return (
      <Overlay isNarrow={false} onClose={onCancel}>
        <div style={{ background: '#fff', borderRadius: 22, padding: 40, fontFamily: 'var(--font-body)', fontSize: 14, color: '#9a9a9a' }}>Carregando imagem…</div>
      </Overlay>
    )
  }

  const image = img
  const baseScale = Math.max(vpW / image.naturalWidth, vpH / image.naturalHeight)
  const scale = baseScale * zoom
  const maxPanX = Math.max(0, (image.naturalWidth * scale - vpW) / 2)
  const maxPanY = Math.max(0, (image.naturalHeight * scale - vpH) / 2)
  const clampedPan = { x: clamp(pan.x, -maxPanX, maxPanX), y: clamp(pan.y, -maxPanY, maxPanY) }

  function onPointerDown(e: React.PointerEvent) {
    ;(e.target as Element).setPointerCapture(e.pointerId)
    dragRef.current = { x: e.clientX, y: e.clientY, panX: clampedPan.x, panY: clampedPan.y }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.x
    const dy = e.clientY - dragRef.current.y
    setPan({ x: clamp(dragRef.current.panX + dx, -maxPanX, maxPanX), y: clamp(dragRef.current.panY + dy, -maxPanY, maxPanY) })
  }
  function onPointerUp() {
    dragRef.current = null
  }

  function confirm() {
    const srcW = vpW / scale
    const srcH = vpH / scale
    const srcX = clamp(image.naturalWidth / 2 - clampedPan.x / scale - srcW / 2, 0, image.naturalWidth - srcW)
    const srcY = clamp(image.naturalHeight / 2 - clampedPan.y / scale - srcH / 2, 0, image.naturalHeight - srcH)

    const outW = aspect >= 1 ? OUT : Math.round(OUT * aspect)
    const outH = aspect >= 1 ? Math.round(OUT / aspect) : OUT
    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(image, srcX, srcY, srcW, srcH, 0, 0, outW, outH)
    try {
      onConfirm(canvas.toDataURL('image/jpeg', 0.88))
    } catch {
      // imagem remota sem CORS liberado: canvas fica "tainted" e não pode ser exportado, mantém a original
      onConfirm(src)
    }
  }

  return (
    <Overlay isNarrow={false} onClose={onCancel}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 22, width: 400, maxWidth: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 70px rgba(0,0,0,.3)', animation: 'modalIn .3s cubic-bezier(.2,.7,.2,1) both' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Ajustar recorte</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onCancel} className="soft-hover" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, color: '#9a9a9a', padding: '9px 12px', borderRadius: 9 }}>Cancelar</button>
            <button onClick={confirm} className="press" style={{ background: '#0a0a0a', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#fff', padding: '9px 18px', borderRadius: 10 }}>Aplicar</button>
          </div>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{ position: 'relative', width: vpW, height: vpH, borderRadius: 15, overflow: 'hidden', background: '#111', cursor: 'grab', touchAction: 'none' }}
          >
            <img
              src={src}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: image.naturalWidth * scale,
                height: image.naturalHeight * scale,
                transform: `translate(-50%, -50%) translate(${clampedPan.x}px, ${clampedPan.y}px)`,
                userSelect: 'none',
              }}
            />
          </div>

          <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: '.06em', color: '#a3a3a3', textTransform: 'uppercase' }}>Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              style={{ flex: 1 }}
            />
          </div>
        </div>
      </div>
    </Overlay>
  )
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}
