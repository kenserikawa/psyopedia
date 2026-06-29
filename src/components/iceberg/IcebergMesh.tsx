'use client'

import { useMemo, useState, useCallback, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import OperationDot from './OperationDot'
import ProceduralIceberg from './ProceduralIceberg'
import type { IcebergOperation } from './OperationDot'
import { useIcebergStore } from './useIcebergStore'
import { ICEBERG_LEVELS } from './constants'

interface IcebergMeshProps {
  operations: IcebergOperation[]
  locale: string
  onSelect: (operation: IcebergOperation) => void
}

// Dot glow colors per level
const LEVEL_DOT_COLOR: Record<number, string> = {
  1: '#1a5a80',
  2: '#3578a0',
  3: '#5098c0',
  4: '#7ab8de',
  5: '#a8d4f0',
}

// Y ranges for each level — centered around the camera Y positions
// Level 1: camera at 4  → dots from 3 to 5
// Level 2: camera at -1 → dots from -2.5 to 0.5
// Level 3: camera at -4 → dots from -5.5 to -2.5
// Level 4: camera at -7 → dots from -8.5 to -5.5
// Level 5: camera at -11 → dots from -13 to -9
const LEVEL_Y_RANGE: Record<number, { min: number; max: number }> = {
  1: { min: 3, max: 5 },
  2: { min: -2.5, max: 0.5 },
  3: { min: -5.5, max: -2.5 },
  4: { min: -8.5, max: -5.5 },
  5: { min: -13, max: -9 },
}

// Iceberg radius at each level — wide at surface, narrow at abyss (matches cylinder mock)
const LEVEL_RADIUS: Record<number, number> = {
  1: 3.0,
  2: 2.5,
  3: 2.0,
  4: 1.5,
  5: 1.0,
}

// Deterministic pseudo-random from string — same slug always gives same number
function seededRandom(str: string): () => number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b)
    h = (h ^ (h >>> 16)) >>> 0
    return h / 0x100000000
  }
}

function computeDotPositions(
  operations: IcebergOperation[]
): { op: IcebergOperation; position: [number, number, number] }[] {
  const result: { op: IcebergOperation; position: [number, number, number] }[] = []

  const byLevel = new Map<number, IcebergOperation[]>()
  for (const op of operations) {
    const arr = byLevel.get(op.icebergLevel) || []
    arr.push(op)
    byLevel.set(op.icebergLevel, arr)
  }

  for (const [level, ops] of byLevel) {
    const range = LEVEL_Y_RANGE[level]
    const radius = LEVEL_RADIUS[level] ?? 2.5
    if (!range) continue

    ops.forEach((op) => {
      const rand = seededRandom(op.slug)

      // Random Y within level range
      const y = range.min + rand() * (range.max - range.min)

      // Random angle and radius variation — minimum grows with depth to keep dots off the Y axis
      const angle = rand() * Math.PI * 2
      const rJitter = 0.9 + rand() * 0.5 // 0.9–1.4 of base radius
      const dotRadius = radius * rJitter

      const x = Math.cos(angle) * dotRadius
      const z = Math.sin(angle) * dotRadius

      result.push({ op, position: [x, y, z] })
    })
  }

  return result
}

export default function IcebergMesh({ operations, locale, onSelect }: IcebergMeshProps) {
  const activeLevel = useIcebergStore((s) => s.activeLevel)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const handleHover = useCallback((id: string | null) => {
    setHoveredId(id)
    document.body.style.cursor = id ? 'pointer' : 'default'
  }, [])

  const dots = useMemo(() => computeDotPositions(operations), [operations])

  // Y-axis drag rotation + scroll-driven rotation
  const groupRef = useRef<THREE.Group>(null)
  const dragState = useRef({ active: false, startX: 0, startRotation: 0 })
  const velocity = useRef(0)
  const currentRotation = useRef(0)
  const prevProgress = useRef(useIcebergStore.getState().scrollProgress)
  const { gl } = useThree()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onPointerDown = useCallback((e: any) => {
    if (hoveredId) return
    e.stopPropagation?.()
    const clientX = e.clientX ?? e.nativeEvent?.clientX ?? 0
    dragState.current = { active: true, startX: clientX, startRotation: currentRotation.current }
    gl.domElement.style.cursor = 'grabbing'
  }, [gl, hoveredId])

  const onPointerUp = useCallback(() => {
    dragState.current.active = false
    gl.domElement.style.cursor = hoveredId ? 'pointer' : 'default'
  }, [gl, hoveredId])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onPointerMove = useCallback((e: any) => {
    if (!dragState.current.active) return
    const clientX = e.clientX ?? e.nativeEvent?.clientX ?? 0
    const delta = (clientX - dragState.current.startX) * 0.005
    const target = dragState.current.startRotation + delta
    velocity.current = target - currentRotation.current
    currentRotation.current = target
  }, [])

  useFrame(() => {
    if (!groupRef.current) return

    // Scroll-driven rotation: add velocity based on scroll delta
    const progress = useIcebergStore.getState().scrollProgress
    const delta = progress - prevProgress.current
    prevProgress.current = progress
    if (!dragState.current.active && Math.abs(delta) > 0.0001) {
      velocity.current += delta * 0.3
    }

    if (!dragState.current.active) {
      // Inertia decay
      velocity.current *= 0.95
      if (Math.abs(velocity.current) > 0.0001) {
        currentRotation.current += velocity.current
      }
    }
    groupRef.current.rotation.y = currentRotation.current
  })

  return (
    <group
      ref={groupRef}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerUp}
    >
      {/* Iceberg procedural (reemplaza el GLB de 74 MB) */}
      <ProceduralIceberg />

      {/* Operation dots */}
      {dots.map(({ op, position }) => (
        <OperationDot
          key={op.id}
          operation={op}
          position={position}
          color={LEVEL_DOT_COLOR[op.icebergLevel] ?? '#3098dd'}
          isHovered={hoveredId === op.id}
          levelDistance={Math.abs(activeLevel - op.icebergLevel)}
          onHover={handleHover}
          onSelect={onSelect}
          locale={locale}
        />
      ))}
    </group>
  )
}
