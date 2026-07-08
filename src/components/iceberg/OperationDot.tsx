'use client'

import { useRef, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { ICEBERG_LEVELS } from './constants'
import { useIcebergStore } from './useIcebergStore'

export interface IcebergOperation {
  id: string
  title: string
  excerpt: string
  era: string
  status: string
  slug: string
  icebergLevel: number
}

interface OperationDotProps {
  operation: IcebergOperation
  position: [number, number, number]
  color: string
  isHovered: boolean
  levelDistance: number
  onHover: (id: string | null) => void
  onSelect: (operation: IcebergOperation) => void
  locale: string
}

const ERA_LABELS: Record<string, Record<string, string>> = {
  en: {
    WWII: 'WWII',
    COLD_WAR: 'Cold War',
    MODERN: 'Modern',
    DIGITAL_AGE: 'Digital Age',
  },
  es: {
    WWII: '2ª Guerra Mundial',
    COLD_WAR: 'Guerra Fría',
    MODERN: 'Era Moderna',
    DIGITAL_AGE: 'Era Digital',
  },
}

// Single shared geometry for all dots (biggest draw call saver)
const SHARED_SPHERE = new THREE.SphereGeometry(0.056, 10, 10)

// Pre-compute level data
const LEVEL_DATA_MAP = new Map(ICEBERG_LEVELS.map((l) => [l.level as number, l]))

// Reusable vectors — zero allocations per frame
const _worldPos = new THREE.Vector3()
const _camDir = new THREE.Vector3()

function OperationDotInner({
  operation,
  position,
  color,
  isHovered,
  levelDistance,
  onHover,
  onSelect,
  locale,
}: OperationDotProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const coreRef = useRef<THREE.MeshStandardMaterial>(null)
  const labelRef = useRef<HTMLDivElement>(null)

  const isLevelActive = levelDistance === 0

  // Smooth animated values
  const hoverT = useRef(0)
  const activeT = useRef(isLevelActive ? 1 : 0)
  const frameSkip = useRef(0)

  const phaseY = position[1]

  useFrame(({ clock, camera }, delta) => {
    const clampedDelta = Math.min(delta, 0.05)

    // Smooth transitions
    hoverT.current += ((isHovered ? 1 : 0) - hoverT.current) * clampedDelta * 8
    activeT.current += ((isLevelActive ? 1 : 0) - activeT.current) * clampedDelta * 5

    const h = hoverT.current
    const a = activeT.current

    // Core dot — scale + emissive
    if (meshRef.current) {
      const t = clock.getElapsedTime()
      meshRef.current.scale.setScalar(1.0 + a * 0.3 + h * 0.4 + Math.sin(t * 1.5 + phaseY) * 0.04 * a)
    }
    if (coreRef.current) {
      coreRef.current.emissiveIntensity = 0.3 + a * 0.7 + h * 1.0
    }

    // Depth blur on labels — update every 3rd frame to reduce DOM thrashing
    frameSkip.current++
    if (labelRef.current && meshRef.current && frameSkip.current % 3 === 0) {
      meshRef.current.getWorldPosition(_worldPos)
      _worldPos.y = 0
      _camDir.copy(camera.position).setY(0).normalize()
      const facing = _worldPos.normalize().dot(_camDir)
      const depthFade = Math.max(0, (1 - facing) * 0.5)

      labelRef.current.style.opacity = String(1 - depthFade * 0.6)
      if (depthFade > 0.05) {
        labelRef.current.style.filter = `blur(${depthFade * 3}px)`
      } else {
        labelRef.current.style.filter = 'none'
      }
    }
  })

  // Pre-compute label data
  const levelData = LEVEL_DATA_MAP.get(operation.icebergLevel)
  const titleColor = levelData?.labelColor ?? '#0a1628'
  const metaColor = levelData?.subtitleColor ?? '#1a3a5c'
  const isDark = operation.icebergLevel >= 3
  const shadowColor = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)'

  // Level distance blur
  const labelOpacity = levelDistance === 0 ? 1 : levelDistance === 1 ? 0.85 : 0.4

  // Only mount Html for active level (biggest perf win)
  const showLabel = levelDistance === 0

  return (
    <group position={position}>
      {/* Single mesh per dot — no glow/ring meshes */}
      <mesh
        ref={meshRef}
        geometry={SHARED_SPHERE}
        onPointerEnter={(e) => {
          e.stopPropagation()
          onHover(operation.id)
          useIcebergStore.getState().setHoveredDotPosition(position)
        }}
        onPointerLeave={() => {
          onHover(null)
          useIcebergStore.getState().setHoveredDotPosition(null)
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(operation)
        }}
      >
        <meshStandardMaterial
          ref={coreRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={levelDistance === 0 ? 1 : levelDistance === 1 ? 0.6 : 0.25}
        />
      </mesh>

      {/* Halo additive */}
      <mesh scale={2.2}>
        <sphereGeometry args={[0.056, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Label — only active level */}
      {showLabel && (
        <Html
          center
          distanceFactor={12}
          style={{ pointerEvents: 'none' }}
          position={[0, 0.3, 0]}
        >
          <div
            ref={labelRef}
            style={{
              opacity: labelOpacity,
              willChange: 'filter, opacity',
            }}
          >
            <p
              className="text-[14px] font-semibold leading-tight whitespace-nowrap"
              style={{ color: titleColor, textShadow: `0 1px 3px ${shadowColor}` }}
            >
              {operation.title}
            </p>
            {isHovered && (
              <div className="mt-0.5 flex flex-col">
                <span
                  className="text-[10px]"
                  style={{ color: metaColor, textShadow: `0 1px 2px ${shadowColor}` }}
                >
                  {(ERA_LABELS[locale] ?? ERA_LABELS.en)[operation.era] ?? operation.era}
                </span>
                <span
                  className="text-[10px] font-medium"
                  style={{ color: titleColor, textShadow: `0 1px 2px ${shadowColor}` }}
                >
                  {locale === 'es' ? 'Clic para ver →' : 'Click to view →'}
                </span>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

const OperationDot = memo(OperationDotInner)
export default OperationDot
