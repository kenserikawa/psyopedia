'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Suspense } from 'react'
import IcebergMesh from './IcebergMesh'

export interface IcebergOperation {
  id: string
  title: string
  excerpt: string
  era: string
  status: string
  slug: string
  icebergLevel: number
}

export interface IcebergSceneProps {
  operations: IcebergOperation[]
  locale: string
  className?: string
  height?: number
}

export default function IcebergScene({ operations, locale, className, height = 650 }: IcebergSceneProps) {
  return (
    <div style={{ height }} className={`w-full relative ${className ?? ''}`}>
      <Canvas
        camera={{ position: [1.5, 0.8, 3.5], fov: 55 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Strong neutral lighting so GLB textures render properly */}
          <ambientLight intensity={1.2} />
          <directionalLight position={[5, 10, 5]} intensity={2.0} />
          <directionalLight position={[-5, 5, -5]} intensity={0.8} />

          {/* Environment map for realistic reflections on the model */}
          <Environment preset="city" />

          <IcebergMesh operations={operations} locale={locale} />

          <OrbitControls
            autoRotate
            autoRotateSpeed={0.3}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.8}
            minDistance={2}
            maxDistance={10}
          />

          <EffectComposer>
            <Bloom luminanceThreshold={0.7} intensity={0.4} radius={0.3} />
          </EffectComposer>
        </Suspense>
      </Canvas>

    </div>
  )
}
