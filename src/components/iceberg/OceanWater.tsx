'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Water } from 'three/examples/jsm/objects/Water.js'
import { useTexture } from '@react-three/drei'

export default function OceanWater() {
  const ref = useRef<Water>(null)
  const waterNormals = useTexture('/textures/waternormals.jpg')

  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping

  const water = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(100, 100)
    const w = new Water(geometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: new THREE.Vector3(0.5, 0.5, 0.5),
      sunColor: 0xffffff,
      waterColor: 0x006994,
      distortionScale: 3.7,
      fog: true,
    })
    w.rotation.x = -Math.PI / 2
    w.position.y = 0
    return w
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waterNormals])

  useFrame((_, delta) => {
    const mat = water.material as THREE.ShaderMaterial
    if (mat.uniforms) {
      mat.uniforms['time'].value += delta * 0.5
    }
  })

  return <primitive object={water} ref={ref} />
}
