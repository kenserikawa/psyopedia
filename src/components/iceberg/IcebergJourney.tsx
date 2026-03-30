'use client'

import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import IcebergCanvas from './IcebergCanvas'
import LevelLabel from './LevelLabel'
import ScrollDepthIndicator from './ScrollDepthIndicator'
import type { IcebergOperation } from './OperationDot'

interface IcebergJourneyProps {
  operations: IcebergOperation[]
  locale: string
}

export default function IcebergJourney({ operations, locale }: IcebergJourneyProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
    })

    const raf = (time: number) => {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    return () => lenis.destroy()
  }, [])

  return (
    <div ref={containerRef} style={{ height: '500vh' }} className="relative">
      {/* Sticky viewport — stays fixed while user scrolls through the 500vh track */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <IcebergCanvas
          scrollContainer={containerRef}
          operations={operations}
          locale={locale}
        />
        <LevelLabel />
        <ScrollDepthIndicator />
      </div>
    </div>
  )
}
