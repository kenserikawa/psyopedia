'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Lenis from 'lenis'
import IcebergCanvas from './IcebergCanvas'
import LevelLabel from './LevelLabel'
import ScrollDepthIndicator from './ScrollDepthIndicator'
import ScrollToTopButton from './ScrollToTopButton'
import type { IcebergOperation } from './OperationDot'

interface IcebergJourneyProps {
  operations: IcebergOperation[]
  locale: string
}

export default function IcebergJourney({ operations, locale }: IcebergJourneyProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const lenisRef = useRef<Lenis | null>(null)
  const router = useRouter()

  const scrollToTop = useCallback(() => {
    lenisRef.current?.scrollTo(0, { duration: 2 })
  }, [])

  const handleSelect = useCallback(
    (operation: IcebergOperation) => {
      router.push(`/${locale}/catalog/${operation.slug}`)
    },
    [router, locale]
  )

  // Lenis smooth scroll + hide scrollbar for this page only
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
    })
    lenisRef.current = lenis

    document.documentElement.style.scrollbarWidth = 'none'
    const style = document.createElement('style')
    style.textContent = '::-webkit-scrollbar { display: none !important; } footer { background: #0a1628 !important; border-color: #0a1628 !important; color: rgba(255,255,255,0.5) !important; }'
    document.head.appendChild(style)

    const raf = (time: number) => {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
      document.documentElement.style.scrollbarWidth = ''
      style.remove()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ height: '500vh' }}
      className="relative"
    >
      {/* Sticky viewport — stays fixed while user scrolls through the 500vh track */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <IcebergCanvas
          scrollContainer={containerRef}
          operations={operations}
          locale={locale}
          onSelect={handleSelect}
        />
        <LevelLabel />
        <ScrollDepthIndicator />
        <ScrollToTopButton onScrollToTop={scrollToTop} />
      </div>
    </div>
  )
}
