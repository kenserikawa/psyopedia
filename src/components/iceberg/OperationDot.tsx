'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
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

export default function OperationDot({
  operation,
  position,
  color,
  isHovered,
  onHover,
}: OperationDotProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

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

  return (
    <group position={position}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.014, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isHovered ? 0.35 : 0.15}
          depthWrite={false}
        />
      </mesh>

      <mesh
        ref={meshRef}
        onPointerEnter={(e) => {
          e.stopPropagation()
          onHover(operation.id)
        }}
      >
        <sphereGeometry args={[0.014, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHovered ? 1.5 : 0.6}
          roughness={0.3}
        />
      </mesh>
    </group>
  )
}
