'use client'

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

export default function MouseParallax({ amount = 0.4 }: { amount?: number }) {
  const { camera } = useThree()
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      target.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useFrame(() => {
    current.current.x += (target.current.x - current.current.x) * 0.05
    current.current.y += (target.current.y - current.current.y) * 0.05
    // Offset aditivo: useScrollCamera fija la base cada frame; aquí solo desplazamos.
    camera.position.x = current.current.x * amount
    camera.position.y += -current.current.y * amount * 0.15
  })

  return null
}
