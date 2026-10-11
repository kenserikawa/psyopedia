'use client'

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomEase } from 'gsap/CustomEase'
import {
  cameraPosition,
  cameraTargetY,
  icebergZoomOut,
  levelContentTop,
} from '@/lib/iceberg-geometry'
import { ICEBERG_LEVELS } from './constants'
import { useIcebergStore } from './useIcebergStore'

gsap.registerPlugin(ScrollTrigger, CustomEase)
const cinematicSilk = CustomEase.create('cinematicSilk', '0.45,0.05,0.55,0.95')

/** Encuadre que el scroll deja fijado; el bucle de render lo lleva a la cámara. */
interface Framing {
  contentTop: number
  distance: number
  elevation: number
  roll: number
}

export function useScrollCamera(scrollContainer: React.RefObject<HTMLDivElement | null>, reducedMotion = false) {
  const { camera } = useThree()
  const size = useThree((s) => s.size)
  const setActiveLevel = useIcebergStore((s) => s.setActiveLevel)
  const setScrollProgress = useIcebergStore((s) => s.setScrollProgress)
  const setCameraTargetY = useIcebergStore((s) => s.setCameraTargetY)

  // Los puntos orbitan por fuera del hielo: en viewports estrechos hay que
  // retirar la cámara o la órbita se sale de plano por los lados.
  const aspect = size.width / Math.max(size.height, 1)
  const zoomOut = icebergZoomOut(aspect, ICEBERG_LEVELS)

  const framing = useRef<Framing>({
    contentTop: levelContentTop(ICEBERG_LEVELS[0].level),
    distance: ICEBERG_LEVELS[0].cameraZ * zoomOut,
    elevation: ICEBERG_LEVELS[0].cameraElevation,
    roll: 0,
  })
  const zoom = useRef(useIcebergStore.getState().zoom)

  // La cámara se aplica en cada frame y no solo al hacer scroll: el zoom manual
  // tiene que poder moverla con la página quieta, y de paso se interpola.
  useFrame(({ clock }, delta) => {
    const target = useIcebergStore.getState().zoom
    zoom.current += (target - zoom.current) * (reducedMotion ? 1 : Math.min(delta * 6, 1))

    const shot = framing.current
    const distance = shot.distance * zoom.current
    const targetY = cameraTargetY(shot.contentTop, distance, shot.elevation)
    const position = cameraPosition(targetY, distance, shot.elevation)

    // Flotabilidad: un cuerpo en el agua nunca está quieto. Son tres senos de
    // periodo largo y primo entre sí, así que el vaivén no se repite a ojo.
    // Sin esto la cámara se lee como un trípode, no como alguien buceando.
    const t = reducedMotion ? 0 : clock.elapsedTime
    const swell = reducedMotion ? 0 : 1
    const driftY = Math.sin(t * 0.31) * 0.3
    const driftZ = Math.sin(t * 0.23 + 1.7) * 0.24
    const driftLook = Math.sin(t * 0.19 + 0.6) * 0.38

    // La X la lleva MouseParallax; aquí solo el eje del descenso.
    camera.position.y = position.y + driftY * swell
    camera.position.z = position.z + driftZ * swell
    camera.lookAt(0, targetY + driftLook * swell, 0)
    // Roll sutil DESPUÉS de lookAt (lookAt sobrescribe el quaternion)
    camera.rotation.z = shot.roll + Math.sin(t * 0.27) * 0.014 * swell

    // Al store va el objetivo limpio: el enfoque del DOF no debe bailar con el
    // vaivén, o la escena entra y sale de foco sola.
    setCameraTargetY(targetY)
  })

  useEffect(() => {
    const container = scrollContainer.current
    if (!container) return
    const triggers: ScrollTrigger[] = []

    // Create one ScrollTrigger per level transition
    ICEBERG_LEVELS.forEach((level, index) => {
      if (index === 0) return

      const prevLevel = ICEBERG_LEVELS[index - 1]

      triggers.push(ScrollTrigger.create({
        trigger: container,
        start: `${(index - 1) * 20}% top`,
        end: `${index * 20}% top`,
        scrub: reducedMotion ? true : 1.5,
        onUpdate: (self) => {
          const p = self.progress
          const e = reducedMotion ? p : cinematicSilk(p)

          // El objetivo sigue a la franja de puntos, no a la cámara: así el
          // encuadre conserva el mismo aire superior en cualquier viewport.
          framing.current = {
            contentTop: gsap.utils.interpolate(
              levelContentTop(prevLevel.level),
              levelContentTop(level.level),
              e
            ),
            distance: gsap.utils.interpolate(prevLevel.cameraZ, level.cameraZ, e) * zoomOut,
            elevation: gsap.utils.interpolate(
              prevLevel.cameraElevation,
              level.cameraElevation,
              e
            ),
            roll: reducedMotion ? 0 : Math.sin(p * Math.PI) * 0.02,
          }

          // Update global progress and active level from progress
          const totalProgress = (index - 1 + p) / (ICEBERG_LEVELS.length - 1)
          setScrollProgress(totalProgress)

          // Derive active level: whichever level we're closer to
          const currentLevel = p < 0.5 ? prevLevel.level : level.level
          setActiveLevel(currentLevel)
        },
      }))
    })

    // Match the actual scroll offset after mounting or changing preferences,
    // rather than reusing stale store state from a previous route visit.
    const bounds = container.getBoundingClientRect()
    const trackProgress = bounds.height > 0
      ? gsap.utils.clamp(0, 1, -bounds.top / (bounds.height * 0.8))
      : 0
    const progress = trackProgress * (ICEBERG_LEVELS.length - 1)
    const index = Math.min(Math.floor(progress), ICEBERG_LEVELS.length - 2)
    const from = ICEBERG_LEVELS[index]
    const to = ICEBERG_LEVELS[index + 1]
    const fraction = reducedMotion ? progress - index : cinematicSilk(progress - index)
    framing.current = {
      contentTop: gsap.utils.interpolate(
        levelContentTop(from.level),
        levelContentTop(to.level),
        fraction
      ),
      distance: gsap.utils.interpolate(from.cameraZ, to.cameraZ, fraction) * zoomOut,
      elevation: gsap.utils.interpolate(from.cameraElevation, to.cameraElevation, fraction),
      roll: reducedMotion ? 0 : Math.sin((progress - index) * Math.PI) * 0.02,
    }
    setScrollProgress(trackProgress)
    setActiveLevel(progress - index < 0.5 ? from.level : to.level)

    return () => {
      triggers.forEach((trigger) => trigger.kill())
    }
  }, [scrollContainer, setActiveLevel, setScrollProgress, reducedMotion, zoomOut])
}
