'use client'

import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomEase } from 'gsap/CustomEase'
import { ICEBERG_LEVELS } from './constants'
import { useIcebergStore } from './useIcebergStore'

gsap.registerPlugin(ScrollTrigger, CustomEase)
const cinematicSilk = CustomEase.create('cinematicSilk', '0.45,0.05,0.55,0.95')

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
          const e = cinematicSilk(p)

          // Interpolate camera position
          camera.position.y = gsap.utils.interpolate(prevLevel.cameraY, level.cameraY, e)
          camera.position.z = gsap.utils.interpolate(prevLevel.cameraZ, level.cameraZ, e)

          // Camera looks slightly below its position
          camera.lookAt(0, camera.position.y - 1.5, 0)
          // Roll sutil DESPUÉS de lookAt (lookAt sobrescribe el quaternion)
          camera.rotation.z = Math.sin(p * Math.PI) * 0.02

          // Update global progress and active level from progress
          const totalProgress = (index - 1 + p) / (ICEBERG_LEVELS.length - 1)
          setScrollProgress(totalProgress)

          // Derive active level: whichever level we're closer to
          const currentLevel = p < 0.5 ? prevLevel.level : level.level
          setActiveLevel(currentLevel)
        },
      })
    })

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill())
      initialized.current = false
    }
  }, [camera, scrollContainer, setActiveLevel, setScrollProgress])
}
