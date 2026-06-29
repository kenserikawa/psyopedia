'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sampleLevels } from './levelSampling'
import { useIcebergStore } from './useIcebergStore'

export default function LightShafts() {
  const groupRef = useRef<THREE.Group>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uIntensity: { value: 1 }, uColor: { value: new THREE.Color('#bfe6ff') } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
        `,
        fragmentShader: /* glsl */ `
          uniform float uIntensity; uniform vec3 uColor; varying vec2 vUv;
          void main(){
            float horiz = smoothstep(0.0,0.25,vUv.x) * smoothstep(1.0,0.75,vUv.x);
            float vert = smoothstep(0.0,0.6,1.0 - vUv.y);
            gl_FragColor = vec4(uColor, horiz * vert * 0.25 * uIntensity);
          }
        `,
      }),
    []
  )

  // Dispose ShaderMaterial on unmount to avoid GPU leak
  useEffect(() => () => { material.dispose() }, [material])

  useFrame(({ clock }) => {
    const s = sampleLevels(useIcebergStore.getState().scrollProgress)
    if (matRef.current) matRef.current.uniforms.uIntensity.value = s.godRayIntensity
    if (groupRef.current) groupRef.current.rotation.y = clock.getElapsedTime() * 0.03
  })

  // Varios planos verticales rotados, anclados en la superficie (y≈4)
  const shafts = [0, 1, 2, 3, 4]
  return (
    <group ref={groupRef} position={[0, 4, 0]}>
      {shafts.map((i) => (
        <mesh key={i} rotation={[0, (i / shafts.length) * Math.PI * 2, 0.15]} position={[0, 0, 0]}>
          <planeGeometry args={[6, 16]} />
          <primitive object={material} ref={i === 0 ? matRef : undefined} attach="material" />
        </mesh>
      ))}
    </group>
  )
}
