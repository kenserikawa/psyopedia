'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Suspense } from 'react'
import IcebergMesh from './IcebergMesh'
import OceanWater from './OceanWater'
import CausticsLight from './CausticsLight'

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
        camera={{ position: [6, 3, 14], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#070f1e']} />
          <fog attach="fog" args={['#070f1e', 25, 65]} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[8, 12, 6]} intensity={1.0} color="#c0e0ff" />
          <pointLight position={[-4, -6, 2]} intensity={0.6} color="#1a4a8a" />
          <pointLight position={[3, -10, -3]} intensity={0.3} color="#0a2a6a" />

          <Environment preset="night" />

          <OceanWater />
          <CausticsLight />
          <IcebergMesh operations={operations} locale={locale} />

          <OrbitControls
            autoRotate
            autoRotateSpeed={0.3}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.8}
            minDistance={10}
            maxDistance={22}
          />

          <EffectComposer>
            <Bloom luminanceThreshold={0.5} intensity={0.6} radius={0.3} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      <div className="absolute inset-0 flex items-center justify-center bg-[#070f1e] -z-10">
        <span className="text-blue-400 text-sm animate-pulse">Loading iceberg...</span>
      </div>
    </div>
  )
}
