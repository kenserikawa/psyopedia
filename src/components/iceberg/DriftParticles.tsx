'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { sampleLevels } from './levelSampling'
import { useIcebergStore } from './useIcebergStore'

export default function DriftParticles({ lowPower = false }: { lowPower?: boolean }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null)
  useFrame(() => {
    const s = sampleLevels(useIcebergStore.getState().scrollProgress)
    if (ref.current?.material) {
      ref.current.material.opacity = 0.2 + s.particleDensity * 0.8
    }
  })
  return (
    <Sparkles
      ref={ref}
      count={lowPower ? 120 : 350}
      scale={[14, 26, 14]}
      position={[0, -6, 0]}
      size={3}
      speed={0.25}
      opacity={0.5}
      color="#cfeeff"
      noise={1}
    />
  )
}
