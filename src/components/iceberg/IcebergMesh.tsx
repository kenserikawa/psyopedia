'use client'

import { useMemo, useState, useCallback } from 'react'
import OperationDot from './OperationDot'
import type { IcebergOperation } from './OperationDot'
import { useIcebergStore } from './useIcebergStore'
import { ICEBERG_LEVELS } from './constants'

interface IcebergMeshProps {
  operations: IcebergOperation[]
  locale: string
}

// Dot glow colors per level
const LEVEL_DOT_COLOR: Record<number, string> = {
  1: '#8ba8c4',
  2: '#6a9dbd',
  3: '#5088aa',
  4: '#3d7090',
  5: '#2a5a78',
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

// Placeholder iceberg radius at each level (wider at depth)
const LEVEL_RADIUS: Record<number, number> = {
  1: 1.2,
  2: 2.0,
  3: 2.8,
  4: 3.2,
  5: 2.5,
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

    ops.forEach((op, i) => {
      // Spread vertically within the level range
      const yFrac = ops.length > 1 ? i / (ops.length - 1) : 0.5
      const y = range.max - yFrac * (range.max - range.min)

      // Spread around circumference
      const hash = op.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
      const angleBase = (i / ops.length) * Math.PI * 2
      const angleJitter = ((hash % 100) / 100 - 0.5) * 0.4
      const angle = angleBase + angleJitter

      const dotRadius = radius + 0.5
      const x = Math.cos(angle) * dotRadius
      const z = Math.sin(angle) * dotRadius

      result.push({ op, position: [x, y, z] })
    })
  }

  return result
}

export default function IcebergMesh({ operations }: IcebergMeshProps) {
  const activeLevel = useIcebergStore((s) => s.activeLevel)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const handleHover = useCallback((id: string | null) => {
    setHoveredId(id)
    document.body.style.cursor = id ? 'pointer' : 'default'
  }, [])

  const dots = useMemo(() => computeDotPositions(operations), [operations])

  return (
    <group>
      {/* Placeholder iceberg — translucent cylinder spanning all levels */}
      {/* Top at y=6 (above level 1), bottom at y=-14 (below level 5) */}
      <mesh position={[0, -4, 0]}>
        <cylinderGeometry args={[3.0, 0.8, 20, 24]} />
        <meshStandardMaterial
          color="#b0d8ee"
          transparent
          opacity={0.15}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* Horizontal rings at level boundaries for visual reference */}
      {ICEBERG_LEVELS.map((level) => {
        const radius = LEVEL_RADIUS[level.level] ?? 2.0
        return (
          <mesh
            key={level.level}
            position={[0, level.cameraY, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[radius, 0.02, 8, 48]} />
            <meshBasicMaterial
              color={level.accentColor}
              transparent
              opacity={activeLevel === level.level ? 0.4 : 0.1}
            />
          </mesh>
        )
      })}

      {/* Operation dots */}
      {dots.map(({ op, position }) => (
        <OperationDot
          key={op.id}
          operation={op}
          position={position}
          color={LEVEL_DOT_COLOR[op.icebergLevel] ?? '#3098dd'}
          isHovered={hoveredId === op.id}
          isLevelActive={activeLevel === op.icebergLevel}
          onHover={handleHover}
        />
      ))}
    </group>
  )
}
