'use client'

import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SEA_LEVEL_Y } from '@/lib/iceberg-geometry'
import { useIcebergStore } from './useIcebergStore'

// Decorado puro: fuera del raycast para no robar los eventos de los puntos.
const NO_RAYCAST = () => null

// Lado del plano. Debe ser mayor que la distancia a la que el shader ya lo ha
// desvanecido, o se vería el borde recto de la geometría cruzando la pantalla.
const PLANE_SIZE = 400

function makeWaterMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uWater: { value: new THREE.Color('#3f7fa6') },
      uHorizon: { value: new THREE.Color('#c9e2f2') },
      uTime: { value: 0 },
      uFade: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uWater; uniform vec3 uHorizon;
      uniform float uTime; uniform float uFade;
      varying vec3 vWorld;

      void main() {
        float d = length(vWorld.xz);

        // Hacia la distancia el agua toma el color del cielo: eso dibuja el
        // horizonte sin necesidad de niebla en este material.
        float horizon = smoothstep(14.0, 95.0, d);
        // Y acaba de desaparecer antes del borde real del plano.
        float vanish = 1.0 - smoothstep(85.0, 145.0, d);

        // Rizado muy tenue y solo cerca, para que no compita con el iceberg.
        float ripple = sin(vWorld.x * 0.5 + uTime * 0.6) * sin(vWorld.z * 0.42 - uTime * 0.45);
        float sheen = (0.5 + 0.5 * ripple) * (1.0 - horizon) * 0.05;

        vec3 col = mix(uWater, uHorizon, horizon) + sheen;

        // Desde abajo es solo un techo insinuado: ya estás sumergido.
        float a = (gl_FrontFacing ? 0.7 : 0.18) * (1.0 - horizon * 0.55) * vanish * uFade;

        gl_FragColor = vec4(col, a);
      }
    `,
  })
}

export default function SeaSurface({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const material = useMemo(() => makeWaterMaterial(), [])
  useEffect(() => () => { material.dispose() }, [material])

  useFrame((_, delta) => {
    const progress = useIcebergStore.getState().scrollProgress
    // Se apaga al dejar atrás la franja de superficie: más abajo no hay nada
    // que separar y una banda horizontal en mitad del plano estorbaría.
    const t = THREE.MathUtils.smoothstep(progress, 0.22, 0.45)
    // eslint-disable-next-line react-hooks/immutability -- uniforms de Three.js, mutación por frame idiomática en R3F
    material.uniforms.uFade.value = 1 - t
    if (!reducedMotion) material.uniforms.uTime.value += delta
  })

  return (
    <mesh
      position={[0, SEA_LEVEL_Y, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      material={material}
      raycast={NO_RAYCAST}
      renderOrder={1}
    >
      <planeGeometry args={[PLANE_SIZE, PLANE_SIZE]} />
    </mesh>
  )
}
