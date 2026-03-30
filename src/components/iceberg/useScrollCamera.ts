'use client'

import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ICEBERG_LEVELS } from './constants'
import { useIcebergStore } from './useIcebergStore'

gsap.registerPlugin(ScrollTrigger)

export function useScrollCamera(scrollContainer: React.RefObject<HTMLDivElement | null>) {
  const { camera } = useThree()
  const setActiveLevel = useIcebergStore((s) => s.setActiveLevel)
  const setScrollProgress = useIcebergStore((s) => s.setScrollProgress)
  const initialized = useRef(false)

  useEffect(() => {
    if (!scrollContainer.current || initialized.current) return
    initialized.current = true

    // Set initial camera position (Level 1)
    camera.position.set(0, ICEBERG_LEVELS[0].cameraY, ICEBERG_LEVELS[0].cameraZ)
    camera.lookAt(0, ICEBERG_LEVELS[0].cameraY - 1.5, 0)

    // Create one ScrollTrigger per level transition
    ICEBERG_LEVELS.forEach((level, index) => {
      if (index === 0) return

      const prevLevel = ICEBERG_LEVELS[index - 1]

      ScrollTrigger.create({
        trigger: scrollContainer.current!,
        start: `${(index - 1) * 20}% top`,
        end: `${index * 20}% top`,
        scrub: 1.5,
        onUpdate: (self) => {
          const p = self.progress

          // Interpolate camera position
          camera.position.y = gsap.utils.interpolate(prevLevel.cameraY, level.cameraY, p)
          camera.position.z = gsap.utils.interpolate(prevLevel.cameraZ, level.cameraZ, p)

          // Camera looks slightly below its position
          camera.lookAt(0, camera.position.y - 1.5, 0)

          // Update global progress
          setScrollProgress((index - 1 + p) / (ICEBERG_LEVELS.length - 1))
        },
        onEnter: () => setActiveLevel(level.level),
        onEnterBack: () => setActiveLevel(prevLevel.level),
      })
    })

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill())
      initialized.current = false
    }
  }, [camera, scrollContainer, setActiveLevel, setScrollProgress])
}
