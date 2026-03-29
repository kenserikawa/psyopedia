'use client'

import { useMemo, useState, useCallback } from 'react'
import * as THREE from 'three'
import OperationDot from './OperationDot'
import type { IcebergOperation } from './IcebergScene'

interface IcebergMeshProps {
  operations: IcebergOperation[]
  locale: string
}

// Y ranges per iceberg level
const LEVEL_Y: Record<number, { min: number; max: number }> = {
  1: { min: 1.0, max: 4.5 },
  2: { min: -1.5, max: 0.5 },
  3: { min: -4.0, max: -2.0 },
  4: { min: -6.5, max: -4.5 },
  5: { min: -9.5, max: -7.0 },
}

// More realistic iceberg profile — angular, asymmetric
function generateIcebergProfile(): THREE.Vector2[] {
  return [
    // Peak — sharp, craggy
    new THREE.Vector2(0, 5.2),
    new THREE.Vector2(0.15, 5.0),
    new THREE.Vector2(0.35, 4.6),
    new THREE.Vector2(0.55, 4.2),
    new THREE.Vector2(0.45, 3.9),
    new THREE.Vector2(0.7, 3.5),
    new THREE.Vector2(0.9, 3.0),
    new THREE.Vector2(0.75, 2.6),
    new THREE.Vector2(1.05, 2.2),
    new THREE.Vector2(1.2, 1.8),
    new THREE.Vector2(1.1, 1.4),
    new THREE.Vector2(1.35, 1.0),
    new THREE.Vector2(1.5, 0.5),
    new THREE.Vector2(1.65, 0.0),    // waterline

    // Underwater — massive, smooth, widening
    new THREE.Vector2(1.9, -0.3),
    new THREE.Vector2(2.3, -0.8),
    new THREE.Vector2(2.7, -1.3),
    new THREE.Vector2(3.1, -1.8),
    new THREE.Vector2(3.4, -2.3),
    new THREE.Vector2(3.7, -2.8),
    new THREE.Vector2(3.9, -3.3),
    new THREE.Vector2(4.05, -3.8),
    new THREE.Vector2(4.1, -4.3),
    new THREE.Vector2(4.05, -4.8),
    new THREE.Vector2(3.9, -5.3),
    new THREE.Vector2(3.75, -5.8),
    new THREE.Vector2(3.55, -6.3),
    new THREE.Vector2(3.3, -6.8),
    new THREE.Vector2(3.0, -7.3),
    new THREE.Vector2(2.65, -7.8),
    new THREE.Vector2(2.25, -8.3),
    new THREE.Vector2(1.8, -8.8),
    new THREE.Vector2(1.3, -9.3),
    new THREE.Vector2(0.75, -9.7),
    new THREE.Vector2(0, -10.0),
  ]
}

function getRadiusAtY(profile: THREE.Vector2[], y: number): number {
  for (let i = 0; i < profile.length - 1; i++) {
    const p1 = profile[i]
    const p2 = profile[i + 1]
    if (p1.y >= y && p2.y <= y) {
      const t = (p1.y - y) / (p1.y - p2.y)
      return p1.x + t * (p2.x - p1.x)
    }
  }
  return 1
}

// Distribute dots evenly around the iceberg at a given Y level
function computeDotPositions(
  operations: IcebergOperation[],
  profile: THREE.Vector2[]
): { op: IcebergOperation; position: [number, number, number] }[] {
  const result: { op: IcebergOperation; position: [number, number, number] }[] = []

  // Group by level
  const byLevel = new Map<number, IcebergOperation[]>()
  for (const op of operations) {
    const arr = byLevel.get(op.icebergLevel) || []
    arr.push(op)
    byLevel.set(op.icebergLevel, arr)
  }

  for (const [level, ops] of byLevel) {
    const range = LEVEL_Y[level]
    if (!range) continue

    ops.forEach((op, i) => {
      // Spread vertically within the level range
      const yFraction = ops.length > 1 ? i / (ops.length - 1) : 0.5
      const y = range.max - yFraction * (range.max - range.min)

      // Get iceberg radius at this y and place dot just outside
      const iceRadius = getRadiusAtY(profile, y)
      const dotRadius = iceRadius + 0.6

      // Spread around the circumference with some randomness based on id
      const hash = op.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
      const angleBase = (i / ops.length) * Math.PI * 2
      const angleJitter = ((hash % 100) / 100 - 0.5) * 0.4
      const angle = angleBase + angleJitter

      const x = Math.cos(angle) * dotRadius
      const z = Math.sin(angle) * dotRadius

      result.push({ op, position: [x, y, z] })
    })
  }

  return result
}

// Dot glow colors per level
const LEVEL_DOT_COLOR: Record<number, string> = {
  1: '#ffffff',
  2: '#60d0ff',
  3: '#3098dd',
  4: '#1a6aaa',
  5: '#0e3870',
}

export default function IcebergMesh({ operations, locale }: IcebergMeshProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const profile = useMemo(() => generateIcebergProfile(), [])
  const geometry = useMemo(() => new THREE.LatheGeometry(profile, 48), [profile])
  const dots = useMemo(() => computeDotPositions(operations, profile), [operations, profile])

  const handleHover = useCallback((id: string | null) => {
    setHoveredId(id)
    document.body.style.cursor = id ? 'pointer' : 'default'
  }, [])

  return (
    <group>
      {/* Iceberg — above water portion */}
      <mesh geometry={geometry} renderOrder={1}>
        <meshStandardMaterial
          color="#d8ecf8"
          roughness={0.15}
          metalness={0.05}
          transparent
          opacity={0.88}
          depthWrite
        />
      </mesh>

      {/* Iceberg — underwater portion (darker, more transparent) */}
      <mesh geometry={geometry} renderOrder={0}>
        <meshStandardMaterial
          color="#1a5a8a"
          roughness={0.5}
          metalness={0.1}
          transparent
          opacity={0.6}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Operation dots */}
      {dots.map(({ op, position }) => (
        <OperationDot
          key={op.id}
          operation={op}
          position={position}
          color={LEVEL_DOT_COLOR[op.icebergLevel] ?? '#3098dd'}
          isHovered={hoveredId === op.id}
          onHover={handleHover}
          locale={locale}
        />
      ))}
    </group>
  )
}
