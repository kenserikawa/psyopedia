'use client'

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ICEBERG_LEVELS } from './constants'
import { useIcebergStore } from './useIcebergStore'

export default function DepthAtmosphere() {
  const { scene } = useThree()
  const ambientRef = useRef<THREE.AmbientLight>(null)
  const pointRef = useRef<THREE.PointLight>(null)

  // Read scrollProgress via subscribe, not selector (avoids re-render)
  const progressRef = useRef(0)
  useEffect(() => {
    return useIcebergStore.subscribe((state) => {
      progressRef.current = state.scrollProgress
    })
  }, [])

  // Initialize fog
  useEffect(() => {
    scene.fog = new THREE.FogExp2('#0a1628', ICEBERG_LEVELS[0].fogDensity)
  }, [scene])

  useFrame(() => {
    const progress = progressRef.current
    const totalLevels = ICEBERG_LEVELS.length - 1
    const levelIndex = Math.min(Math.floor(progress * totalLevels), totalLevels - 1)
    const levelFrac = (progress * totalLevels) % 1
    const curr = ICEBERG_LEVELS[levelIndex]
    const next = ICEBERG_LEVELS[Math.min(levelIndex + 1, totalLevels)]

    // Fog density
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.density = curr.fogDensity + (next.fogDensity - curr.fogDensity) * levelFrac
    }

    // Ambient light dims with depth
    if (ambientRef.current) {
      ambientRef.current.intensity = curr.ambientIntensity + (next.ambientIntensity - curr.ambientIntensity) * levelFrac
    }

    // Point light color shifts
    if (pointRef.current) {
      const currColor = new THREE.Color(curr.accentColor)
      const nextColor = new THREE.Color(next.accentColor)
      pointRef.current.color.copy(currColor.lerp(nextColor, levelFrac))
    }
  })

  return (
    <>
      <ambientLight ref={ambientRef} intensity={ICEBERG_LEVELS[0].ambientIntensity} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} color="#c0e0ff" />
      <directionalLight position={[-5, 5, -5]} intensity={0.8} />
      <pointLight ref={pointRef} position={[0, -5, 3]} intensity={1.2} color="#1a4a8a" />
      {/* Deep bioluminescent glows */}
      <pointLight position={[-3, -9, 2]} intensity={0.3} color="#0022ff" />
      <pointLight position={[3, -8, -2]} intensity={0.2} color="#002299" />
    </>
  )
}
