'use client'

import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  buildIcebergGeometry,
  buildSilhouette,
  computeDotPositions,
} from '@/lib/iceberg-geometry'
import LabelDeclutter from './LabelDeclutter'
import OperationDot from './OperationDot'
import ProceduralIceberg from './ProceduralIceberg'
import type { IcebergOperation } from './OperationDot'
import { useIcebergStore } from './useIcebergStore'

interface IcebergMeshProps {
  operations: IcebergOperation[]
  locale: string
  onSelect: (operation: IcebergOperation) => void
  lowPower?: boolean
  reducedMotion?: boolean
  /** Sin hover, abrir la operación pasa a ser el segundo toque. */
  noHover?: boolean
}

// Dot glow colors per level
const LEVEL_DOT_COLOR: Record<number, string> = {
  1: '#1a5a80',
  2: '#3578a0',
  3: '#5098c0',
  4: '#7ab8de',
  5: '#a8d4f0',
}

// Píxeles de recorrido a partir de los cuales el gesto es un giro y no un clic.
const DRAG_THRESHOLD = 5
// Ventana tras soltar un arrastre en la que se ignora la selección de un punto.
const CLICK_SUPPRESSION_MS = 250

export default function IcebergMesh({ operations, locale, onSelect, lowPower = false, reducedMotion = false, noHover = false }: IcebergMeshProps) {
  const activeLevel = useIcebergStore((s) => s.activeLevel)
  const setHoveredOperation = useIcebergStore((s) => s.setHoveredOperation)
  const setSelectedOperation = useIcebergStore((s) => s.setSelectedOperation)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const handleHover = useCallback((id: string | null) => {
    setHoveredId(id)
    setHoveredOperation(id)
    document.body.style.cursor = id ? 'pointer' : 'default'
  }, [setHoveredOperation])

  // La geometría se genera con ruido nuevo en cada montaje: los puntos se
  // colocan midiendo esa forma concreta, no una estimación.
  const shape = useMemo(() => {
    const geometry = buildIcebergGeometry(lowPower)
    return { geometry, silhouette: buildSilhouette(geometry) }
  }, [lowPower])
  useEffect(() => () => { shape.geometry.dispose() }, [shape])

  const dots = useMemo(
    () => computeDotPositions(operations, shape.silhouette),
    [operations, shape]
  )

  // Y-axis drag rotation + scroll-driven rotation
  const groupRef = useRef<THREE.Group>(null)
  const dragging = useRef(false)
  const dragEndedAt = useRef(0)
  const velocity = useRef(0)
  const currentRotation = useRef(0)
  const prevProgress = useRef(useIcebergStore.getState().scrollProgress)
  const gl = useThree((s) => s.gl)

  // El arrastre escucha en el canvas, no en la malla: así el hielo puede quedar
  // fuera del raycast y los puntos reciben sus propios eventos sin competencia.
  useEffect(() => {
    const el = gl.domElement
    let activePointer: number | null = null
    let startX = 0
    let startRotation = 0
    let moved = false

    const onDown = (e: PointerEvent) => {
      if (!e.isPrimary) return
      activePointer = e.pointerId
      startX = e.clientX
      startRotation = currentRotation.current
      moved = false
    }

    const onMove = (e: PointerEvent) => {
      if (activePointer === null || e.pointerId !== activePointer) return
      const dx = e.clientX - startX
      if (!moved) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return
        moved = true
        dragging.current = true
        el.style.cursor = 'grabbing'
      }
      const target = startRotation + dx * 0.005
      velocity.current = target - currentRotation.current
      currentRotation.current = target
    }

    const onUp = (e: PointerEvent) => {
      if (activePointer === null || e.pointerId !== activePointer) return
      activePointer = null
      if (moved) dragEndedAt.current = performance.now()
      dragging.current = false
      moved = false
      el.style.cursor = ''
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      el.style.cursor = ''
    }
  }, [gl])

  // Soltar un arrastre encima de un punto no debe navegar.
  const handleSelect = useCallback((operation: IcebergOperation) => {
    if (performance.now() - dragEndedAt.current < CLICK_SUPPRESSION_MS) return

    // Sin hover, el primer toque abre el expediente y solo el segundo navega:
    // si no, el usuario se va de la página sin llegar a ver la ficha.
    if (noHover && useIcebergStore.getState().selectedOperationId !== operation.id) {
      setSelectedOperation(operation.id)
      return
    }

    onSelect(operation)
  }, [onSelect, noHover, setSelectedOperation])

  useFrame(() => {
    if (!groupRef.current) return

    // Scroll-driven rotation: add velocity based on scroll delta
    const progress = useIcebergStore.getState().scrollProgress
    const delta = progress - prevProgress.current
    prevProgress.current = progress
    if (!reducedMotion && !dragging.current && Math.abs(delta) > 0.0001) {
      velocity.current += delta * 0.3
    }

    if (reducedMotion) velocity.current = 0
    if (!reducedMotion && !dragging.current) {
      // Inertia decay
      velocity.current *= 0.95
      if (Math.abs(velocity.current) > 0.0001) {
        currentRotation.current += velocity.current
      }
    }
    groupRef.current.rotation.y = currentRotation.current
  })

  return (
    <group ref={groupRef}>
      {/* Iceberg procedural (reemplaza el GLB de 74 MB) */}
      <ProceduralIceberg geometry={shape.geometry} lowPower={lowPower} reducedMotion={reducedMotion} />

      {/* Árbitro de los rótulos que caen en el mismo sitio */}
      <LabelDeclutter reducedMotion={reducedMotion} />

      {/* Operation dots */}
      {dots.map(({ op, position, stagger }) => (
        <OperationDot
          key={op.id}
          operation={op}
          position={position}
          stagger={stagger}
          color={LEVEL_DOT_COLOR[op.icebergLevel] ?? '#3098dd'}
          isHovered={hoveredId === op.id}
          levelDistance={Math.abs(activeLevel - op.icebergLevel)}
          onHover={handleHover}
          onSelect={handleSelect}
          locale={locale}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  )
}
