'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
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
  const defaultOp = operations.find((o) => o.icebergLevel === 1) ?? operations[0] ?? null
  const [selected, setSelected] = useState<IcebergOperation | null>(defaultOp)

  const handleDotHover = useCallback((id: string | null) => {
    if (id) {
      const op = operations.find((o) => o.id === id) ?? null
      setSelected(op)
    }
    document.body.style.cursor = id ? 'pointer' : 'default'
  }, [operations])

  return (
    <div className={`container mx-auto px-4 ${className ?? ''}`}>
      {/* Desktop/tablet: side by side. Mobile: stacked */}
      <div className="flex flex-col md:flex-row md:items-center md:gap-8 lg:gap-12">
        {/* Canvas */}
        <div className="w-full md:w-[60%] md:shrink-0 lg:w-[65%] relative h-[500px] md:h-[600px] lg:h-[650px]">
          <Canvas
            camera={{ position: [0.5, 0.3, 1.2], fov: 55 }}
            gl={{ antialias: true, alpha: true }}
            dpr={[1, 2]}
            style={{ background: 'transparent' }}
          >
            <Suspense fallback={null}>
              <ambientLight intensity={2.0} />
              <directionalLight position={[5, 10, 5]} intensity={3.0} />
              <directionalLight position={[-5, 5, -5]} intensity={1.8} />
              <directionalLight position={[0, -5, 5]} intensity={1.0} />
              <hemisphereLight args={['#ddeeff', '#88aacc', 0.8]} />

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

        {/* Info panel: below on mobile, right side on md+ */}
        <SidePanel selected={selected} />
      </div>
    </div>
  )
}

function SidePanel({ selected }: { selected: IcebergOperation | null }) {
  const [visible, setVisible] = useState(false)
  const [display, setDisplay] = useState<IcebergOperation | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (selected) {
      // If switching between operations, fade out then in
      if (display && display.id !== selected.id) {
        setVisible(false)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
          setDisplay(selected)
          setVisible(true)
        }, 150)
      } else if (!display) {
        setDisplay(selected)
        // Small delay so the element renders before fading in
        requestAnimationFrame(() => setVisible(true))
      }
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [selected, display])

  return (
    <div className="mt-6 px-2 md:mt-0 md:w-72 md:shrink-0 md:flex md:flex-col md:justify-center lg:w-80">
      <div className="min-h-[120px] md:min-h-[200px]">
        {display ? (
          <div
            className="transition-all duration-300 ease-out"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible
                ? 'translateY(0)'
                : 'translateY(6px)',
            }}
          >
            {/* Level indicator */}
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.15em]">
                Level {display.icebergLevel}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Classification */}
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.1em] mb-1">
              {LEVEL_LABELS[display.icebergLevel]}
            </p>

            {/* Title */}
            <h3 className="text-lg font-bold text-foreground leading-tight tracking-tight">
              {display.title}
            </h3>

            {/* Meta */}
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
              <span>{ERA_LABELS[display.era] ?? display.era}</span>
              <span className="text-border">|</span>
              <span>{display.status.replace('_', ' ')}</span>
            </div>

            {/* Divider */}
            <div className="h-px bg-border my-3" />

            {/* Excerpt */}
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              {display.excerpt.length > 220
                ? display.excerpt.slice(0, 220) + '...'
                : display.excerpt}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/50 italic text-center md:text-left">
            Hover over a point to inspect
          </p>
        )}
      </div>
    </div>
  )
}
