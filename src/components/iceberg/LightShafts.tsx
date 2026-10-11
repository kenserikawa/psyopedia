'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sampleLevels, type InterpolatedLevel } from './levelSampling'
import { useIcebergStore } from './useIcebergStore'

export default function LightShafts({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const sample = useRef<InterpolatedLevel>(sampleLevels(0))

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
            // Meseta horizontal ancha: cada plano ilumina de forma uniforme y los
            // del anillo se funden entre sí, en vez de dejar lóbulos separados.
            float horiz = smoothstep(0.0,0.16,vUv.x) * smoothstep(1.0,0.84,vUv.x);
            // Caída vertical larga y suave, apagándose antes del final del plano
            // para que no quede un borde caliente a la altura del iceberg.
            float vert = smoothstep(0.0,0.75,1.0 - vUv.y) * smoothstep(0.0,0.35,vUv.y + 0.2);
            gl_FragColor = vec4(uColor, horiz * vert * 0.07 * uIntensity);
          }
        `,
      }),
    []
  )

  // Dispose ShaderMaterial on unmount to avoid GPU leak
  useEffect(() => () => { material.dispose() }, [material])

  useFrame(({ clock }) => {
    const s = sampleLevels(useIcebergStore.getState().scrollProgress, sample.current)
    if (matRef.current) matRef.current.uniforms.uIntensity.value = s.godRayIntensity
    if (groupRef.current && !reducedMotion) groupRef.current.rotation.y = clock.getElapsedTime() * 0.03
  })

  // Planos verticales repartidos en anillo alrededor del iceberg, anclados en la
  // superficie (y≈4). Si se centran todos en el origen se cruzan sobre el eje y
  // sus máximos se suman justo detrás del hielo: un destello quemado.
  const shafts = [0, 1, 2, 3, 4, 5]
  const RING_RADIUS = 5.5
  return (
    <group ref={groupRef} position={[0, 4, 0]}>
      {shafts.map((i) => {
        const angle = (i / shafts.length) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * RING_RADIUS, 0, Math.sin(angle) * RING_RADIUS]}
            rotation={[0, -angle, 0.12]}
          >
            <planeGeometry args={[7, 16]} />
            <primitive object={material} ref={i === 0 ? matRef : undefined} attach="material" />
          </mesh>
        )
      })}
    </group>
  )
}
