'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { BlendFunction, Effect } from 'postprocessing'
import { useIcebergStore } from './useIcebergStore'

/**
 * Ondulación del propio plano: no es la escena la que se mueve, es el agua
 * entre la cámara y la escena. Es el indicio que separa "mirar un objeto en 3D"
 * de "mirar a través de un fluido", y el que más rinde por lo poco que cuesta.
 *
 * Solo desplaza las UV de muestreo: no añade una pasada de color.
 */
const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uStrength;

  void mainUv(inout vec2 uv) {
    // Dos trenes de onda cruzados y de periodo distinto: el patrón no se repite
    // a ojo y no aparece el rayado que deja una sola onda.
    float wx = sin(uv.y * 16.0 + uTime * 1.10) + sin(uv.y * 27.0 - uTime * 0.70) * 0.5;
    float wy = sin(uv.x * 13.0 - uTime * 0.90) + sin(uv.x * 22.0 + uTime * 0.55) * 0.5;

    uv.x += wx * uStrength;
    uv.y += wy * uStrength * 0.65;
  }
`

/** Nada más sumergirse apenas se insinúa; en el fondo el agua pesa. */
const MIN_STRENGTH = 0.0008
const MAX_STRENGTH = 0.0034

/** Tramo de scroll en el que la cámara atraviesa la lámina de agua. */
const CROSSING_FROM = 0.06
const CROSSING_TO = 0.22

function smoothstep(x: number, min: number, max: number) {
  if (x <= min) return 0
  if (x >= max) return 1
  const t = (x - min) / (max - min)
  return t * t * (3 - 2 * t)
}

class UnderwaterEffectImpl extends Effect {
  constructor() {
    super('UnderwaterDistortion', fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ['uTime', new THREE.Uniform(0)],
        ['uStrength', new THREE.Uniform(MIN_STRENGTH)],
      ]),
    })
  }

  update(_renderer: THREE.WebGLRenderer, _input: THREE.WebGLRenderTarget, delta: number) {
    const progress = useIcebergStore.getState().scrollProgress
    this.uniforms.get('uTime')!.value += delta

    // Sobre la superficie no se mira a través de nada: la ondulación entra al
    // cruzar la lámina y a partir de ahí crece con la profundidad.
    const submerged = smoothstep(progress, CROSSING_FROM, CROSSING_TO)
    this.uniforms.get('uStrength')!.value =
      submerged * (MIN_STRENGTH + (MAX_STRENGTH - MIN_STRENGTH) * progress)
  }
}

export default function UnderwaterDistortion() {
  const effect = useMemo(() => new UnderwaterEffectImpl(), [])
  useEffect(() => () => { effect.dispose() }, [effect])
  return <primitive object={effect} />
}
