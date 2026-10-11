'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sampleLevels, type InterpolatedLevel } from './levelSampling'
import { useIcebergStore } from './useIcebergStore'

/**
 * Nieve marina: el sedimento que atraviesas al bajar.
 *
 * Es el único indicio de velocidad del viaje — el iceberg está lejos y apenas
 * cambia de tamaño, así que sin partículas cerca no se percibe el movimiento.
 * El campo se envuelve alrededor de la cámara en lugar de ocupar una caja fija,
 * porque el descenso recorre ~40 unidades y cualquier caja acaba quedándose
 * atrás.
 */

/** Alto del cilindro que rodea a la cámara; las partículas se reciclan dentro. */
const SPAN = 72
const RADIUS = 26

/** Cuánto sube el sedimento por unidad de avance del scroll. */
const SCROLL_RISE = 26

/**
 * Dos capas: el campo lejano da la textura del agua y el cercano, con motas
 * grandes y desenfocadas pasando junto al objetivo, es lo que separa el primer
 * plano del fondo. Sin él todo ocurre a la misma distancia.
 */
const LAYERS = {
  far: { radius: RADIUS, span: SPAN, size: 26, opacity: 1, rise: 1 },
  near: { radius: 7, span: 26, size: 150, opacity: 0.3, rise: 2.1 },
} as const

function makeGeometry(count: number, radiusMax: number, span: number) {
  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    // Reparto en disco por raíz del radio: si no, se apelmazan en el centro.
    const angle = Math.random() * Math.PI * 2
    const radius = Math.sqrt(Math.random()) * radiusMax
    positions[i * 3] = Math.cos(angle) * radius
    positions[i * 3 + 1] = (Math.random() - 0.5) * span
    positions[i * 3 + 2] = Math.sin(angle) * radius
    seeds[i] = Math.random()
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  // El envoltorio mueve los vértices en el shader: sin esto, three recorta el
  // campo por una caja que ya no corresponde a dónde están las partículas.
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4)
  return geometry
}

function makeMaterial(span: number, size: number) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uCenter: { value: 0 },
      uRise: { value: 0 },
      uTime: { value: 0 },
      uOpacity: { value: 0.5 },
      uSize: { value: size },
      uSpan: { value: span },
      uColor: { value: new THREE.Color('#cfeeff') },
    },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uCenter, uRise, uTime, uSize, uSpan;
      varying float vFade;

      void main() {
        vec3 p = position;

        // Deriva propia + arrastre del scroll, y reciclado dentro del tramo:
        // el campo es infinito sin tener que crear partículas nuevas.
        float span = uSpan;
        float y = p.y + uRise + uTime * (0.25 + aSeed * 0.35);
        p.y = mod(y - uCenter + span * 0.5, span) - span * 0.5 + uCenter;

        // Vaivén lateral suave, desfasado por partícula.
        float sway = sin(uTime * 0.4 + aSeed * 12.57) * (0.3 + aSeed * 0.5);
        p.x += sway;
        p.z += sway * 0.6;

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        // Se apagan en los extremos del tramo para que no aparezcan de golpe.
        vFade = 1.0 - smoothstep(span * 0.32, span * 0.5, abs(p.y - uCenter));
        gl_PointSize = uSize * (0.4 + aSeed) / max(-mv.z, 1.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity;
      varying float vFade;
      void main() {
        // Mota redonda y difusa, no el cuadrado que da gl_PointCoord en crudo.
        float d = length(gl_PointCoord - 0.5);
        float alpha = smoothstep(0.5, 0.05, d) * vFade * uOpacity;
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  })
}

const NO_RAYCAST = () => null

function SnowLayer({ count, layer }: { count: number; layer: (typeof LAYERS)[keyof typeof LAYERS] }) {
  const geometry = useMemo(
    () => makeGeometry(count, layer.radius, layer.span),
    [count, layer]
  )
  const material = useMemo(() => makeMaterial(layer.span, layer.size), [layer])
  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])

  const sample = useRef<InterpolatedLevel>(sampleLevels(0))
  const previousProgress = useRef(useIcebergStore.getState().scrollProgress)

  useFrame(({ camera }, delta) => {
    const progress = useIcebergStore.getState().scrollProgress
    const advance = progress - previousProgress.current
    previousProgress.current = progress

    const s = sampleLevels(progress, sample.current)
    const uniforms = material.uniforms
    // Al bajar, el sedimento sube: es el gesto que se lee como velocidad. La
    // capa cercana sube más rápido, que es el paralaje que da la profundidad.
    uniforms.uRise.value += advance * SCROLL_RISE * layer.rise
    uniforms.uTime.value += delta
    uniforms.uCenter.value = camera.position.y
    uniforms.uOpacity.value = (0.18 + s.particleDensity * 0.55) * layer.opacity
  })

  return <points geometry={geometry} material={material} raycast={NO_RAYCAST} frustumCulled={false} />
}

export default function MarineSnow({ lowPower = false }: { lowPower?: boolean }) {
  return (
    <>
      <SnowLayer count={lowPower ? 320 : 900} layer={LAYERS.far} />
      <SnowLayer count={lowPower ? 18 : 40} layer={LAYERS.near} />
    </>
  )
}
