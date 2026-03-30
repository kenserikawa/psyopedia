'use client'

import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Suspense } from 'react'
import IcebergMesh from './IcebergMesh'
import DepthAtmosphere from './DepthAtmosphere'
import { useScrollCamera } from './useScrollCamera'
import type { IcebergOperation } from './OperationDot'

interface IcebergCanvasProps {
  scrollContainer: React.RefObject<HTMLDivElement | null>
  operations: IcebergOperation[]
  locale: string
}

function SceneContent({ scrollContainer, operations, locale }: IcebergCanvasProps) {
  useScrollCamera(scrollContainer)

  return (
    <>
      <DepthAtmosphere />
      <Environment preset="night" />
      <IcebergMesh operations={operations} locale={locale} />

      <EffectComposer>
        <Bloom luminanceThreshold={0.6} intensity={0.5} radius={0.3} />
      </EffectComposer>
    </>
  )
}

export default function IcebergCanvas({ scrollContainer, operations, locale }: IcebergCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 4, 12], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 1.5]}
      style={{ background: '#0a1628' }}
    >
      <Suspense fallback={null}>
        <SceneContent
          scrollContainer={scrollContainer}
          operations={operations}
          locale={locale}
        />
      </Suspense>
    </Canvas>
  )
}
