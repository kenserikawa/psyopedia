'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import OperationDot from './OperationDot'
import type { IcebergOperation } from './IcebergScene'

interface IcebergMeshProps {
  operations: IcebergOperation[]
  locale: string
}

// Preload the model
useGLTF.preload('/iceberg.glb')

// Y ranges per level as fraction of iceberg height (0 = top, 1 = bottom)
const LEVEL_FRACTIONS: Record<number, { min: number; max: number }> = {
  1: { min: 0.0, max: 0.15 },
  2: { min: 0.15, max: 0.35 },
  3: { min: 0.35, max: 0.55 },
  4: { min: 0.55, max: 0.75 },
  5: { min: 0.75, max: 1.0 },
}

// Dot glow colors per level
const LEVEL_DOT_COLOR: Record<number, string> = {
  1: '#ffffff',
  2: '#60d0ff',
  3: '#3098dd',
  4: '#1a6aaa',
  5: '#0e3870',
}

interface ModelBounds {
  yMin: number
  yMax: number
  height: number
  center: THREE.Vector3
  // Approximate radius at a given Y by sampling the geometry
  radiusAtY: (y: number) => number
}

function computeModelBounds(scene: THREE.Group): ModelBounds {
  const box = new THREE.Box3().setFromObject(scene)
  const center = new THREE.Vector3()
  box.getCenter(center)

  const yMin = box.min.y
  const yMax = box.max.y
  const height = yMax - yMin

  // Build a radius lookup by sampling all mesh vertices
  const radiusSamples = new Map<number, number>() // bucketed Y -> max radius
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const pos = child.geometry.getAttribute('position')
      if (!pos) return
      const worldMatrix = child.matrixWorld
      const v = new THREE.Vector3()
      for (let i = 0; i < pos.count; i++) {
        v.set(pos.getX(i), pos.getY(i), pos.getZ(i))
        v.applyMatrix4(worldMatrix)
        const bucket = Math.round(v.y * 2) / 2 // bucket to 0.5 increments
        const r = Math.sqrt((v.x - center.x) ** 2 + (v.z - center.z) ** 2)
        const current = radiusSamples.get(bucket) ?? 0
        if (r > current) radiusSamples.set(bucket, r)
      }
    }
  })

  const radiusAtY = (y: number): number => {
    const bucket = Math.round(y * 2) / 2
    // Check nearby buckets
    for (const offset of [0, 0.5, -0.5, 1, -1]) {
      const val = radiusSamples.get(bucket + offset)
      if (val !== undefined) return val
    }
    // Fallback: rough estimate from bounding box
    const xRange = (box.max.x - box.min.x) / 2
    const zRange = (box.max.z - box.min.z) / 2
    return Math.max(xRange, zRange)
  }

  return { yMin, yMax, height, center, radiusAtY }
}

function computeDotPositions(
  operations: IcebergOperation[],
  bounds: ModelBounds
): { op: IcebergOperation; position: [number, number, number] }[] {
  const result: { op: IcebergOperation; position: [number, number, number] }[] = []

  const byLevel = new Map<number, IcebergOperation[]>()
  for (const op of operations) {
    const arr = byLevel.get(op.icebergLevel) || []
    arr.push(op)
    byLevel.set(op.icebergLevel, arr)
  }

  for (const [level, ops] of byLevel) {
    const frac = LEVEL_FRACTIONS[level]
    if (!frac) continue

    // Convert fractions to actual Y positions (top of model = yMax, bottom = yMin)
    const levelYMax = bounds.yMax - frac.min * bounds.height
    const levelYMin = bounds.yMax - frac.max * bounds.height

    ops.forEach((op, i) => {
      const yFraction = ops.length > 1 ? i / (ops.length - 1) : 0.5
      const y = levelYMax - yFraction * (levelYMax - levelYMin)

      const iceRadius = bounds.radiusAtY(y)
      const dotRadius = iceRadius + 0.8

      // Spread around circumference
      const hash = op.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
      const angleBase = (i / ops.length) * Math.PI * 2
      const angleJitter = ((hash % 100) / 100 - 0.5) * 0.4
      const angle = angleBase + angleJitter

      const x = bounds.center.x + Math.cos(angle) * dotRadius
      const z = bounds.center.z + Math.sin(angle) * dotRadius

      result.push({ op, position: [x, y, z] })
    })
  }

  return result
}

export default function IcebergMesh({ operations, locale }: IcebergMeshProps) {
  const { scene } = useGLTF('/iceberg.glb')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Compute bounds once the model loads
  const bounds = useMemo(() => {
    scene.updateMatrixWorld(true)
    return computeModelBounds(scene)
  }, [scene])

  // Make all materials in the GLB slightly transparent for the icy look
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshStandardMaterial
        if (mat.isMeshStandardMaterial) {
          mat.transparent = true
          mat.opacity = 0.85
          mat.roughness = Math.min(mat.roughness, 0.3)
        }
      }
    })
  }, [scene])

  const dots = useMemo(
    () => computeDotPositions(operations, bounds),
    [operations, bounds]
  )

  const handleHover = useCallback((id: string | null) => {
    setHoveredId(id)
    document.body.style.cursor = id ? 'pointer' : 'default'
  }, [])

  return (
    <group>
      {/* GLB iceberg model */}
      <primitive object={scene} />

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
