'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js'

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

export default function ProceduralIceberg({ lowPower = false }: ProceduralIcebergProps) {
  const geometry = useMemo(() => buildIcebergGeometry(lowPower), [lowPower])
  useEffect(() => () => { geometry.dispose() }, [geometry])

  return (
    <group position={[0, -3, 0]} scale={1.4}>
      <mesh geometry={geometry}>
        {/* Material temporal — se reemplaza por hielo en la Task 2 */}
        <meshStandardMaterial color="#bfe4f7" roughness={0.15} metalness={0.05} flatShading />
      </mesh>
    </group>
  )
}
