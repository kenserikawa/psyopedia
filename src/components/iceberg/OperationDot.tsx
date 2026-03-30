'use client'

import { useRef, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { ICEBERG_LEVELS } from './constants'

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
  isLevelActive: boolean
  onHover: (id: string | null) => void
}

const ERA_LABELS: Record<string, string> = {
  WWII: 'WWII',
  COLD_WAR: 'Cold War',
  MODERN: 'Modern',
  DIGITAL_AGE: 'Digital Age',
}

function OperationDotInner({
  operation,
  position,
  color,
  isHovered,
  isLevelActive,
  onHover,
}: OperationDotProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (meshRef.current) {
      const base = isLevelActive ? 1.4 : 1.0
      const hover = isHovered ? 0.6 : 0
      const pulse = Math.sin(t * 2 + position[1]) * (isLevelActive ? 0.1 : 0.05)
      meshRef.current.scale.setScalar(base + hover + pulse)
    }
    if (glowRef.current) {
      const base = isLevelActive ? 2.5 : 1.5
      const hover = isHovered ? 1.5 : 0
      const pulse = Math.sin(t * 1.5 + position[1]) * 0.2
      glowRef.current.scale.setScalar(base + hover + pulse)
    }
  })

  const dimOpacity = isLevelActive ? 0.2 : 0.08
  const emissiveStrength = isLevelActive ? (isHovered ? 2.0 : 1.0) : 0.3

  return (
    <group position={position}>
      {/* Glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.014, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isHovered ? 0.4 : dimOpacity}
          depthWrite={false}
        />
      </mesh>

      {/* Core dot */}
      <mesh
        ref={meshRef}
        onPointerEnter={(e) => {
          e.stopPropagation()
          onHover(operation.id)
        }}
        onPointerLeave={() => onHover(null)}
      >
        <sphereGeometry args={[0.014, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveStrength}
          roughness={0.3}
        />
      </mesh>

      {/* Expanded label when level is active */}
      {isLevelActive && (() => {
        const levelData = ICEBERG_LEVELS.find((l) => l.level === operation.icebergLevel)
        const titleColor = levelData?.labelColor ?? '#0a1628'
        const metaColor = levelData?.subtitleColor ?? '#1a3a5c'
        // Dark levels need light shadow, light levels need dark shadow
        const isDark = operation.icebergLevel >= 3
        const shadowColor = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)'

        return (
          <Html
            center
            distanceFactor={12}
            style={{ pointerEvents: 'none' }}
            position={[0, 0.3, 0]}
          >
            <div className="transition-opacity duration-300" style={{ opacity: 1 }}>
              <p
                className="text-[7px] font-semibold leading-tight whitespace-nowrap"
                style={{ color: titleColor, textShadow: `0 1px 3px ${shadowColor}` }}
              >
                {operation.title}
              </p>
              {isHovered && (
                <div className="mt-0.5">
                  <span
                    className="text-[5px]"
                    style={{ color: metaColor, textShadow: `0 1px 2px ${shadowColor}` }}
                  >
                    {ERA_LABELS[operation.era] ?? operation.era}
                  </span>
                </div>
              )}
            </div>
          </Html>
        )
      })()}
    </group>
  )
}

const OperationDot = memo(OperationDotInner)
export default OperationDot
