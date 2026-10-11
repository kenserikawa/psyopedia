'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { labelEntries, type LabelEntry } from './labelRegistry'

// Recalcular colisiones obliga a medir el layout de ~20 rótulos. Se hace cada
// pocos frames; la aplicación del resultado, en cambio, va en todos, para que
// ceder y recuperar el sitio sea un fundido y no un parpadeo.
const COLLISION_EVERY = 5

/** Aire alrededor de cada rótulo: pegados se leen como una sola línea. */
const PADDING = 4

/** Por debajo de esto la etiqueta ya no se dibuja. */
const MIN_OPACITY = 0.04

interface Rect {
  left: number
  right: number
  top: number
  bottom: number
}

function overlaps(a: Rect, b: Rect): boolean {
  return !(
    a.right + PADDING < b.left ||
    b.right + PADDING < a.left ||
    a.bottom + PADDING < b.top ||
    b.bottom + PADDING < a.top
  )
}

function resolveCollisions(entries: LabelEntry[]) {
  // Lectura del layout en bloque y escritura después: un solo reflujo.
  const candidates: { entry: LabelEntry; rect: Rect }[] = []
  for (const entry of entries) {
    if (entry.opacity < MIN_OPACITY) {
      entry.suppressed = 1
      continue
    }
    const rect = entry.el.getBoundingClientRect()
    if (rect.width === 0) continue
    candidates.push({ entry, rect })
  }

  // De mayor a menor prioridad: la primera en llegar se queda el sitio.
  candidates.sort((a, b) => b.entry.priority - a.entry.priority)

  const kept: Rect[] = []
  for (const { entry, rect } of candidates) {
    const collides = kept.some((other) => overlaps(rect, other))
    entry.suppressed = collides ? 1 : 0
    if (!collides) kept.push(rect)
  }
}

/**
 * Árbitro de las etiquetas: cuando dos caen en el mismo sitio, deja la de mayor
 * prioridad y funde la otra. Vive dentro del Canvas para compartir el bucle de
 * render con los puntos.
 */
export default function LabelDeclutter({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const frame = useRef(0)

  useFrame((_, delta) => {
    const entries = labelEntries()
    if (entries.length === 0) return

    if (frame.current++ % COLLISION_EVERY === 0) resolveCollisions(entries)

    const step = reducedMotion ? 1 : Math.min(delta * 9, 1)
    for (const entry of entries) {
      entry.suppressionT += (entry.suppressed - entry.suppressionT) * step

      const opacity = entry.opacity * (1 - entry.suppressionT)
      const style = entry.el.style
      if (opacity < MIN_OPACITY) {
        style.visibility = 'hidden'
      } else {
        style.visibility = 'visible'
        style.opacity = String(opacity)
        style.filter = entry.blur > 0.15 ? `blur(${entry.blur.toFixed(2)}px)` : 'none'
      }
    }
  })

  return null
}
