'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  EffectComposer, Bloom, DepthOfField, Vignette, Noise, ChromaticAberration,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { sampleLevels, type InterpolatedLevel } from './levelSampling'
import UnderwaterDistortion from './UnderwaterDistortion'
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
  const sample = useRef<InterpolatedLevel>(sampleLevels(0))

  useFrame(() => {
    const state = useIcebergStore.getState()
    const s = sampleLevels(state.scrollProgress, sample.current)

    // Foco del DOF: el dot hovered, o el centro del iceberg a la altura de cámara
    if (state.hoveredDotPosition) {
      _focusTarget.current.set(
        state.hoveredDotPosition[0],
        state.hoveredDotPosition[1],
        state.hoveredDotPosition[2]
      )
    } else {
      // El objetivo real de la cámara, no un offset bajo ella: en la vista
      // cenital del arranque está muy por debajo y el DOF desenfocaría todo.
      _focusTarget.current.set(0, state.cameraTargetY, 0)
    }
    const dist = camera.position.distanceTo(_focusTarget.current)
    const coc = dofRef.current?.cocMaterial ?? dofRef.current?.circleOfConfusionMaterial
    if (coc?.uniforms?.focusDistance) {
      coc.uniforms.focusDistance.value = Math.min(dist / 30, 1)
    }

    if (vignetteRef.current) vignetteRef.current.darkness = s.vignette
    if (noiseRef.current?.blendMode?.opacity) noiseRef.current.blendMode.opacity.value = s.grain

    // ChromaticAberration: en postprocessing v6 `offset` es un Uniform<Vector2> (tiene .value);
    // en otras versiones es un Vector2 directo. Soportar ambas sin romper el frame (evita el
    // throw que provocaba el WebGL Context Lost).
    const off = caRef.current?.offset
    if (off?.value?.set) off.value.set(s.chromaticAberration, s.chromaticAberration)
    else if (off?.set) off.set(s.chromaticAberration, s.chromaticAberration)
  })

  // multisampling=0: evita el blit MSAA+depth/stencil (GL_INVALID_OPERATION → Context Lost)
  // que rompe DepthOfField en muchos drivers/headless. El canvas ya usa antialias y
  // bloom(mipmapBlur)+DOF suavizan los bordes del iceberg low-poly.
  return (
    <EffectComposer multisampling={0}>
      {/* Antes que nada: lo que sigue ya se pinta sobre la imagen ondulada. */}
      <UnderwaterDistortion />
      <Bloom luminanceThreshold={0.65} intensity={0.6} radius={0.5} mipmapBlur />
      {lowPower ? <></> : (
        <DepthOfField ref={dofRef} focusDistance={0.02} focalLength={0.05} bokehScale={3} />
      )}
      {/* Callback refs, no RefObject: estos efectos van envueltos en wrapEffect, que usa
          JSON.stringify(props) como dependencia de useMemo. En React 19 `ref` es un prop
          normal: un RefObject con el efecto asignado (que referencia la cámara) crea un
          ciclo children/parent y el stringify lanza en cada re-render. Las funciones se
          omiten al serializar. */}
      <ChromaticAberration
        ref={(e: unknown) => { caRef.current = e }}
        blendFunction={BlendFunction.NORMAL}
        offset={[0.0006, 0.0006]}
      />
      <Vignette ref={(e: unknown) => { vignetteRef.current = e }} eskil={false} offset={0.3} darkness={0.25} />
      <Noise ref={(e: unknown) => { noiseRef.current = e }} premultiply blendFunction={BlendFunction.OVERLAY} />
    </EffectComposer>
  )
}
