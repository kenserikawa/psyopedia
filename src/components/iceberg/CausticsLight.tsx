'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const causticsVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const causticsFragmentShader = `
  uniform float time;
  uniform float intensity;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  float causticPattern(vec2 uv, float t) {
    vec2 p = uv * 6.0;
    float v = 0.0;
    v += sin(p.x + t) * sin(p.y + t);
    v += sin(p.x * 1.3 + t * 1.1) * sin(p.y * 0.8 + t * 0.9);
    v += sin((p.x + p.y) * 0.7 + t * 1.3);
    return (v + 3.0) / 6.0;
  }

  void main() {
    if (vWorldPosition.y > 0.1) discard;
    float depth = abs(vWorldPosition.y) / 10.0;
    float c = causticPattern(vUv, time * 0.5);
    float fadeWithDepth = 1.0 - depth * 0.8;
    gl_FragColor = vec4(0.3, 0.7, 1.0, c * intensity * fadeWithDepth);
  }
`

export default function CausticsLight() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(() => ({
    time: { value: 0 },
    intensity: { value: 0.4 },
  }), [])

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value += delta
    }
  })

  return (
    <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[20, 20, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={causticsVertexShader}
        fragmentShader={causticsFragmentShader}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}
