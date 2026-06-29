'use client'

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ICEBERG_LEVELS } from './constants'
import { sampleLevels, type InterpolatedLevel } from './levelSampling'
import { useIcebergStore } from './useIcebergStore'

export default function DepthAtmosphere() {
  const { scene } = useThree()
  const ambientRef = useRef<THREE.AmbientLight>(null)

  // Read scrollProgress via subscribe, not selector (avoids re-render)
  const progressRef = useRef(0)
  useEffect(() => {
    return useIcebergStore.subscribe((state) => {
      progressRef.current = state.scrollProgress
    })
  }, [])

  // Initialize fog + background
  useEffect(() => {
    scene.fog = new THREE.FogExp2('#eaf6ff', ICEBERG_LEVELS[0].fogDensity)
    scene.background = new THREE.Color('#eaf6ff')
  }, [scene])

  const sample = useRef<InterpolatedLevel>(sampleLevels(0))
  useFrame(() => {
    const s = sampleLevels(progressRef.current, sample.current)
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.density = s.fogDensity
      scene.fog.color.copy(s.fogColor)
    }
    if (scene.background instanceof THREE.Color) scene.background.copy(s.bgColor)
    if (ambientRef.current) ambientRef.current.intensity = s.ambientIntensity
  })

  return (
    <>
      <ambientLight ref={ambientRef} intensity={ICEBERG_LEVELS[0].ambientIntensity} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} color="#c0e0ff" />
      <directionalLight position={[-5, 5, -5]} intensity={0.8} />
      <pointLight position={[0, -5, 3]} intensity={1.2} color="#1a4a8a" />
      {/* Deep bioluminescent glows */}
      <pointLight position={[-3, -9, 2]} intensity={0.3} color="#0022ff" />
      <pointLight position={[3, -8, -2]} intensity={0.2} color="#002299" />
    </>
  )
}
