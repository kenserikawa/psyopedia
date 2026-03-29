'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { IcebergOperation } from './IcebergScene'

interface OperationDotProps {
  operation: IcebergOperation
  position: [number, number, number]
  color: string
  isHovered: boolean
  onHover: (id: string | null) => void
  locale: string
}

const ERA_LABELS: Record<string, string> = {
  WWII: 'WWII',
  COLD_WAR: 'Cold War',
  MODERN: 'Modern',
  DIGITAL_AGE: 'Digital Age',
}

export default function OperationDot({
  operation,
  position,
  color,
  isHovered,
  onHover,
  locale,
}: OperationDotProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  // Gentle pulse animation
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const scale = isHovered ? 1.8 : 1.0 + Math.sin(clock.getElapsedTime() * 2 + position[1]) * 0.15
      meshRef.current.scale.setScalar(scale)
    }
    if (glowRef.current) {
      const glowScale = isHovered ? 3.5 : 2.0 + Math.sin(clock.getElapsedTime() * 1.5 + position[1]) * 0.3
      glowRef.current.scale.setScalar(glowScale)
    }
  })

  const title = locale === 'es' ? operation.title : operation.title
  const excerpt = locale === 'es' ? operation.excerpt : operation.excerpt

  return (
    <group position={position}>
      {/* Glow sphere (larger, faint) */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isHovered ? 0.35 : 0.15}
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
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHovered ? 1.5 : 0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Tooltip on hover */}
      {isHovered && (
        <Html
          center
          distanceFactor={2}
          style={{ pointerEvents: 'none' }}
          position={[0, 0.15, 0]}
        >
          <div className="bg-[#0a1628]/95 border border-blue-500/30 rounded p-1.5 w-32 backdrop-blur-sm shadow-lg shadow-blue-900/40">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[6px] font-bold text-blue-400 uppercase tracking-wider">
                Lv{operation.icebergLevel}
              </span>
              <span className="text-[6px] text-slate-500">
                {ERA_LABELS[operation.era] ?? operation.era}
              </span>
            </div>
            <p className="text-[7px] font-semibold text-blue-50 leading-tight">
              {title}
            </p>
            <p className="text-[6px] text-slate-400 mt-0.5 line-clamp-2 leading-tight">
              {excerpt.length > 80 ? excerpt.slice(0, 80) + '...' : excerpt}
            </p>
          </div>
        </Html>
      )}
    </group>
  )
}
