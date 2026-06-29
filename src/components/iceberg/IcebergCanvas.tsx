'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useRef } from 'react'
import IcebergMesh from './IcebergMesh'
import DepthAtmosphere from './DepthAtmosphere'
import DriftParticles from './DriftParticles'
import LightShafts from './LightShafts'
import { useScrollCamera } from './useScrollCamera'
import type { IcebergOperation } from './OperationDot'
import PostFX from './PostFX'

interface IcebergCanvasProps {
  scrollContainer: React.RefObject<HTMLDivElement | null>
  operations: IcebergOperation[]
  locale: string
  onSelect: (operation: IcebergOperation) => void
}

function PerfMonitor() {
  const { gl } = useThree()
  const frames = useRef(0)
  const lastTime = useRef(performance.now())
  const divRef = useRef<HTMLDivElement | null>(null)

  if (!divRef.current && typeof document !== 'undefined') {
    const div = document.createElement('div')
    div.style.cssText = 'position:fixed;top:8px;left:8px;z-index:9999;font:12px monospace;color:#0f0;background:rgba(0,0,0,0.7);padding:4px 8px;border-radius:4px;pointer-events:none'
    document.body.appendChild(div)
    divRef.current = div
  }

  useFrame(() => {
    frames.current++
    const now = performance.now()
    if (now - lastTime.current >= 500) {
      const fps = Math.round(frames.current / ((now - lastTime.current) / 1000))
      const info = gl.info.render
      if (divRef.current) {
        divRef.current.textContent = `${fps} FPS | ${info.calls} draws | ${info.triangles} tris`
      }
      frames.current = 0
      lastTime.current = now
    }
  })

  return null
}

function SceneContent({ scrollContainer, operations, locale, onSelect }: IcebergCanvasProps) {
  useScrollCamera(scrollContainer)

  return (
    <>
      {process.env.NODE_ENV === 'development' && <PerfMonitor />}
      <DepthAtmosphere />
      <LightShafts />
      <DriftParticles />
      <IcebergMesh operations={operations} locale={locale} onSelect={onSelect} />
    </>
  )
}

export default function IcebergCanvas({ scrollContainer, operations, locale, onSelect }: IcebergCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 4, 12], fov: 50 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      dpr={[1, 1.5]}
    >
      <Suspense fallback={null}>
        <SceneContent
          scrollContainer={scrollContainer}
          operations={operations}
          locale={locale}
          onSelect={onSelect}
        />
        <PostFX />
      </Suspense>
    </Canvas>
  )
}
