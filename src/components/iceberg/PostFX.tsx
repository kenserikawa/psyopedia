'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  EffectComposer, Bloom, DepthOfField, Vignette, Noise, ChromaticAberration,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { sampleLevels } from './levelSampling'
import { useIcebergStore } from './useIcebergStore'

export default function PostFX({ lowPower = false }: { lowPower?: boolean }) {
  const { camera } = useThree()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dofRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vignetteRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const noiseRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const caRef = useRef<any>(null)
  const _focusTarget = useRef(new THREE.Vector3(0, -3, 0))

  useFrame(() => {
    const state = useIcebergStore.getState()
    const s = sampleLevels(state.scrollProgress)

    // Foco del DOF: el dot hovered, o el centro del iceberg a la altura de cámara
    if (state.hoveredDotPosition) _focusTarget.current.set(...state.hoveredDotPosition)
    else _focusTarget.current.set(0, camera.position.y - 1.5, 0)
    const dist = camera.position.distanceTo(_focusTarget.current)
    if (dofRef.current) dofRef.current.circleOfConfusionMaterial.uniforms.focusDistance.value =
      dist / 50 // normalizado aprox.; afinar visualmente

    if (vignetteRef.current) vignetteRef.current.darkness = s.vignette
    if (noiseRef.current) noiseRef.current.blendMode.opacity.value = s.grain
    if (caRef.current) caRef.current.offset.set(s.chromaticAberration, s.chromaticAberration)
  })

  return (
    <EffectComposer multisampling={lowPower ? 0 : 2}>
      <Bloom luminanceThreshold={0.65} intensity={0.6} radius={0.5} mipmapBlur />
      {lowPower ? <></> : (
        <DepthOfField ref={dofRef} focusDistance={0.02} focalLength={0.05} bokehScale={3} />
      )}
      <ChromaticAberration ref={caRef} blendFunction={BlendFunction.NORMAL} offset={[0.0006, 0.0006]} />
      <Vignette ref={vignetteRef} eskil={false} offset={0.3} darkness={0.25} />
      <Noise ref={noiseRef} premultiply blendFunction={BlendFunction.OVERLAY} />
    </EffectComposer>
  )
}
