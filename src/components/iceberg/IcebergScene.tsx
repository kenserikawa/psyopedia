'use client'

import { useState, useCallback } from 'react'
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

const ERA_LABELS: Record<string, string> = {
  WWII: 'WWII',
  COLD_WAR: 'Cold War',
  MODERN: 'Modern',
  DIGITAL_AGE: 'Digital Age',
}

const LEVEL_LABELS: Record<number, string> = {
  1: 'Well-Known',
  2: 'Underappreciated',
  3: 'Leaked',
  4: 'Alleged',
  5: 'Deep Conspiracy',
}

export default function IcebergScene({ operations, locale, className, height = 650 }: IcebergSceneProps) {
  const [selected, setSelected] = useState<IcebergOperation | null>(null)

  const handleDotHover = useCallback((id: string | null) => {
    if (id) {
      const op = operations.find((o) => o.id === id) ?? null
      setSelected(op)
    }
    document.body.style.cursor = id ? 'pointer' : 'default'
  }, [operations])

  return (
    <div style={{ height }} className={`w-full relative flex ${className ?? ''}`}>
      {/* Canvas */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [0.5, 0.3, 1.2], fov: 55 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={1.5} />
            <directionalLight position={[5, 10, 5]} intensity={2.5} />
            <directionalLight position={[-5, 5, -5]} intensity={1.2} />
            <directionalLight position={[0, -5, 5]} intensity={0.6} />

            <Environment preset="city" />

            <IcebergMesh
              operations={operations}
              locale={locale}
              hoveredId={selected?.id ?? null}
              onDotHover={handleDotHover}
            />

            <OrbitControls
              autoRotate
              autoRotateSpeed={0.3}
              enablePan={false}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 1.8}
              minDistance={0.8}
              maxDistance={6}
            />

            <EffectComposer>
              <Bloom luminanceThreshold={0.7} intensity={0.4} radius={0.3} />
            </EffectComposer>
          </Suspense>
        </Canvas>
      </div>

      {/* Side panel tooltip */}
      <div className="w-64 shrink-0 flex items-center pl-4">
        {selected ? (
          <div className="bg-card border border-border rounded-lg p-4 shadow-sm w-full transition-opacity duration-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Level {selected.icebergLevel}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {LEVEL_LABELS[selected.icebergLevel]}
              </span>
            </div>
            <h3 className="text-sm font-bold text-foreground leading-snug">
              {selected.title}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-muted-foreground">
                {ERA_LABELS[selected.era] ?? selected.era}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {selected.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {selected.excerpt.length > 200
                ? selected.excerpt.slice(0, 200) + '...'
                : selected.excerpt}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Hover over a dot to see details
          </p>
        )}
      </div>
    </div>
  )
}
