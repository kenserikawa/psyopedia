'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js'
import { sampleLevels, type InterpolatedLevel } from './levelSampling'
import { useIcebergStore } from './useIcebergStore'

interface ProceduralIcebergProps {
  lowPower?: boolean
}

// Construye una geometría de iceberg: icosaedro subdividido, desplazado con FBM,
// estirado y afilado hacia abajo para la masa sumergida (regla del iceberg).
function buildIcebergGeometry(lowPower: boolean): THREE.BufferGeometry {
  const detail = lowPower ? 4 : 6
  const geo = new THREE.IcosahedronGeometry(2, detail)
  const simplex = new SimplexNoise()
  const pos = geo.attributes.position
  const v = new THREE.Vector3()

  // FBM: varias octavas de simplex
  const fbm = (x: number, y: number, z: number) => {
    let amp = 1, freq = 0.9, sum = 0, norm = 0
    for (let o = 0; o < 4; o++) {
      sum += amp * simplex.noise3d(x * freq, y * freq, z * freq)
      norm += amp
      amp *= 0.5
      freq *= 2.1
    }
    return sum / norm
  }

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const dir = v.clone().normalize()
    const n = fbm(dir.x, dir.y, dir.z) // -1..1

    // Desplazamiento facetado del relieve
    const r = 2 + n * 0.55

    // Masa sumergida: estirar e ir afilando por debajo de y=0
    if (dir.y < 0) {
      const d = -dir.y // 0..1
      v.multiplyScalar(r)
      v.y *= 1 + d * 5.0          // estira hacia abajo (~6x de profundidad)
      const taper = 1 - d * 0.45  // afila el fondo
      v.x *= taper
      v.z *= taper
    } else {
      v.multiplyScalar(r)
      v.y *= 1.1 // pico ligeramente más alto
    }
    pos.setXYZ(i, v.x, v.y, v.z)
  }

  // Facetas: sin índice + normales por cara
  const flat = geo.toNonIndexed()
  flat.computeVertexNormals()
  geo.dispose()
  return flat
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

export default function ProceduralIceberg({ lowPower = false }: ProceduralIcebergProps) {
  const geometry = useMemo(() => buildIcebergGeometry(lowPower), [lowPower])
  useEffect(() => () => { geometry.dispose() }, [geometry])
  const rimMaterial = useMemo(() => makeRimMaterial(), [])
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
  })

  return (
    <group position={[0, -3, 0]} scale={1.4}>
      <mesh geometry={geometry}>
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
          temporalDistortion={0.1}
          samples={lowPower ? 4 : 8}
          resolution={lowPower ? 256 : 512}
          color="#dff1ff"
          attenuationColor="#9fd6f0"
          attenuationDistance={4}
          background={undefined}
        />
      </mesh>
      {/* Borde fresnel glacial */}
      <mesh geometry={geometry} material={rimMaterial} scale={1.015} />
    </group>
  )
}
