'use client'

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

export default function MouseParallax({ amount = 0.4 }: { amount?: number }) {
  const { camera } = useThree()
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const previousX = camera.position.x
    const onMove = (e: MouseEvent) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      target.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      camera.position.x = previousX
    }
  }, [camera])

  useFrame(() => {
    current.current.x += (target.current.x - current.current.x) * 0.05
    current.current.y += (target.current.y - current.current.y) * 0.05
    // Offset aditivo: useScrollCamera fija la base cada frame; aquí solo desplazamos.
    // eslint-disable-next-line react-hooks/immutability
    camera.position.x = current.current.x * amount
  })

  return null
}
