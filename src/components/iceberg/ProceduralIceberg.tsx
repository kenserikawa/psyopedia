'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { ICEBERG_ORIGIN_Y, ICEBERG_SCALE } from '@/lib/iceberg-geometry'
import { sampleLevels, type InterpolatedLevel } from './levelSampling'
import { useIcebergStore } from './useIcebergStore'

interface ProceduralIcebergProps {
  /** Geometría compartida con IcebergMesh, que también la mide para orbitar los puntos. */
  geometry: THREE.BufferGeometry
  lowPower?: boolean
  reducedMotion?: boolean
}

// El hielo es decorado: si participa en el raycast se queda con los eventos de
// puntero y los puntos que tiene delante o detrás dejan de poder seleccionarse.
const NO_RAYCAST = () => null

/**
 * Cáusticas: la luz de la superficie, refractada por el oleaje, barriendo el
 * hielo. Es el indicio que dice "esto está bajo el agua" sin necesidad de más
 * atrezzo. Solo prenden en las caras que miran hacia arriba y se apagan con la
 * profundidad, donde ya no llega luz.
 */
function makeCausticsMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 1 },
      uColor: { value: new THREE.Color('#dff4ff') },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      varying vec3 vNormalW;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform float uIntensity; uniform vec3 uColor;
      varying vec3 vWorld; varying vec3 vNormalW;

      void main() {
        // Interferencia de tres ondas: el retículo irregular de las cáusticas.
        vec2 p = vWorld.xz * 0.55;
        float w = sin(p.x + uTime) * sin(p.y + uTime * 0.9);
        w += sin(p.x * 1.4 - uTime * 0.7) * sin(p.y * 1.1 + uTime * 1.2);
        w += sin((p.x + p.y) * 0.8 + uTime * 0.5);
        float caustic = pow(max(w / 3.0 + 0.5, 0.0), 4.0);

        // Solo en lo que mira al cielo, y solo cerca de la superficie.
        float up = max(vNormalW.y, 0.0);
        float depth = smoothstep(-16.0, 1.0, vWorld.y);

        gl_FragColor = vec4(uColor, caustic * up * depth * uIntensity * 0.5);
      }
    `,
  })
}

// Material fresnel additive para el borde glacial (rim light frío).
function makeRimMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide,
    uniforms: {
      uColor: { value: new THREE.Color('#bfe9ff') },
      uPower: { value: 2.5 },
      uIntensity: { value: 0.6 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormalW;
      varying vec3 vViewDir;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uPower; uniform float uIntensity;
      varying vec3 vNormalW; varying vec3 vViewDir;
      void main() {
        float fres = pow(1.0 - max(dot(normalize(vNormalW), normalize(vViewDir)), 0.0), uPower);
        gl_FragColor = vec4(uColor * fres * uIntensity, fres);
      }
    `,
  })
}

export default function ProceduralIceberg({ geometry, lowPower = false, reducedMotion = false }: ProceduralIcebergProps) {
  const rimMaterial = useMemo(() => makeRimMaterial(), [])
  useEffect(() => () => { rimMaterial.dispose() }, [rimMaterial])
  const causticsMaterial = useMemo(() => makeCausticsMaterial(), [])
  useEffect(() => () => { causticsMaterial.dispose() }, [causticsMaterial])
  // MeshTransmissionMaterial no exporta un tipo público estable: ref laxo.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matRef = useRef<any>(null)
  const sample = useRef<InterpolatedLevel>(sampleLevels(0))

  useFrame((_, delta) => {
    const progress = useIcebergStore.getState().scrollProgress
    sampleLevels(progress, sample.current)
    const s = sample.current
    if (matRef.current) {
      // Lerp suave para evitar saltos
      const k = Math.min(delta * 4, 1)
      matRef.current.color.lerp(s.iceColor, k)
      matRef.current.roughness += (s.iceRoughness - matRef.current.roughness) * k
      matRef.current.thickness += (s.iceThickness - matRef.current.thickness) * k
    }
    // El rim se apaga con la profundidad
    // eslint-disable-next-line react-hooks/immutability
    rimMaterial.uniforms.uIntensity.value = 0.15 + s.godRayIntensity * 0.6
    // Las cáusticas dependen de que llegue luz de arriba: siguen al godRay.
    // eslint-disable-next-line react-hooks/immutability
    causticsMaterial.uniforms.uIntensity.value = s.godRayIntensity
    if (!reducedMotion) causticsMaterial.uniforms.uTime.value += delta * 0.6
  })

  return (
    <group position={[0, ICEBERG_ORIGIN_Y, 0]} scale={ICEBERG_SCALE}>
      <mesh geometry={geometry} raycast={NO_RAYCAST}>
        <MeshTransmissionMaterial
          ref={matRef}
          transmission={lowPower ? 0.6 : 1}
          thickness={1.2}
          roughness={0.08}
          ior={1.31}
          chromaticAberration={0.04}
          anisotropy={0.1}
          distortion={0.2}
          distortionScale={0.3}
          temporalDistortion={reducedMotion ? 0 : 0.1}
          samples={lowPower ? 4 : 8}
          resolution={lowPower ? 256 : 512}
          color="#dff1ff"
          attenuationColor="#9fd6f0"
          attenuationDistance={4}
          background={undefined}
        />
      </mesh>
      {/* Luz de la superficie barriendo el hielo */}
      <mesh geometry={geometry} material={causticsMaterial} scale={1.002} raycast={NO_RAYCAST} />

      {/* Borde fresnel glacial */}
      <mesh geometry={geometry} material={rimMaterial} scale={1.015} raycast={NO_RAYCAST} />
    </group>
  )
}
