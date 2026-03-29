'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing'
import { Suspense } from 'react'
import IcebergMesh from './IcebergMesh'
import OceanWater from './OceanWater'
import CausticsLight from './CausticsLight'

export interface IcebergSceneProps {
  levelStats: {
    level: number
    count: number
    featured: string[]
    label: string
  }[]
  onLevelClick: (level: number) => void
  className?: string
  height?: number
}

export default function IcebergScene({ levelStats, onLevelClick, className, height = 600 }: IcebergSceneProps) {
  return (
    <div style={{ height }} className={`w-full relative ${className ?? ''}`}>
      <Canvas
        camera={{ position: [4, 5, 12], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#0a1628']} />
          <fog attach="fog" args={['#0a1628', 20, 60]} />
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 10, 5]} intensity={1.2} color="#b0d8ff" />
          <pointLight position={[-5, -8, 0]} intensity={0.8} color="#1a4a8a" />

          <Environment preset="night" />

          <OceanWater />
          <CausticsLight />
          <IcebergMesh levelStats={levelStats} onLevelClick={onLevelClick} />

          <OrbitControls
            autoRotate
            autoRotateSpeed={0.4}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.8}
            minDistance={8}
            maxDistance={20}
          />

          <EffectComposer>
            <Bloom luminanceThreshold={0.6} intensity={0.8} radius={0.4} />
            <DepthOfField focusDistance={0.02} focalLength={0.05} bokehScale={2} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      <div className="absolute inset-0 flex items-center justify-center bg-[#0a1628] -z-10">
        <span className="text-blue-400 text-sm animate-pulse">Loading iceberg...</span>
      </div>
    </div>
  )
}
