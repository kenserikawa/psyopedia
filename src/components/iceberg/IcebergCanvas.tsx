'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useRef } from 'react'
import { ICEBERG_CAMERA_FOV } from '@/lib/iceberg-geometry'
import IcebergMesh from './IcebergMesh'
import DepthAtmosphere from './DepthAtmosphere'
import MarineSnow from './MarineSnow'
import LightShafts from './LightShafts'
import SeaSurface from './SeaSurface'
import { useScrollCamera } from './useScrollCamera'
import { useIcebergStore } from './useIcebergStore'
import type { IcebergOperation } from './OperationDot'
import PostFX from './PostFX'
import MouseParallax from './MouseParallax'

interface IcebergCanvasProps {
  scrollContainer: React.RefObject<HTMLDivElement | null>
  operations: IcebergOperation[]
  locale: string
  onSelect: (operation: IcebergOperation) => void
  lowPower?: boolean
  reducedMotion?: boolean
  noHover?: boolean
}

function PerfMonitor() {
  const { gl } = useThree()
  const frames = useRef(0)
  const lastTime = useRef(0)
  const divRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const div = document.createElement('div')
    div.style.cssText = 'position:fixed;top:8px;left:8px;z-index:9999;font:12px monospace;color:#0f0;background:rgba(0,0,0,0.7);padding:4px 8px;border-radius:4px;pointer-events:none'
    document.body.appendChild(div)
    divRef.current = div
    return () => {
      div.remove()
      divRef.current = null
    }
  }, [])

  useFrame(() => {
    frames.current++
    const now = performance.now()
    if (lastTime.current === 0) lastTime.current = now
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

function SceneContent({ scrollContainer, operations, locale, onSelect, lowPower = false, reducedMotion = false, noHover = false }: IcebergCanvasProps) {
  useScrollCamera(scrollContainer, reducedMotion)

  return (
    <>
      {!lowPower && <MouseParallax />}
      {process.env.NODE_ENV === 'development' && <PerfMonitor />}
      <DepthAtmosphere />
      <LightShafts reducedMotion={reducedMotion} />
      <SeaSurface reducedMotion={reducedMotion} />
      {!reducedMotion && <MarineSnow lowPower={lowPower} />}
      <IcebergMesh operations={operations} locale={locale} onSelect={onSelect} lowPower={lowPower} reducedMotion={reducedMotion} noHover={noHover} />
    </>
  )
}

export default function IcebergCanvas({ scrollContainer, operations, locale, onSelect, lowPower = false, reducedMotion = false, noHover = false }: IcebergCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 4, 12], fov: ICEBERG_CAMERA_FOV }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      dpr={lowPower ? 1 : [1, 1.5]}
      // Tocar el fondo cierra el expediente abierto por selección táctil.
      onPointerMissed={() => useIcebergStore.getState().setSelectedOperation(null)}
    >
      <Suspense fallback={null}>
        <SceneContent
          scrollContainer={scrollContainer}
          operations={operations}
          locale={locale}
          onSelect={onSelect}
          lowPower={lowPower}
          reducedMotion={reducedMotion}
          noHover={noHover}
        />
        <PostFX lowPower={lowPower} />
      </Suspense>
    </Canvas>
  )
}
