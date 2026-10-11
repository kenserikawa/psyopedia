'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Lenis from 'lenis'
import IcebergCanvas from './IcebergCanvas'
import LevelLabel from './LevelLabel'
import ClassifiedPanel from './ClassifiedPanel'
import ScrollDepthIndicator from './ScrollDepthIndicator'
import { ICEBERG_LEVELS } from './constants'
import ScrollToTopButton from './ScrollToTopButton'
import type { IcebergOperation } from './OperationDot'
import { useIcebergPreferences } from './useIcebergPreferences'

interface IcebergJourneyProps {
  operations: IcebergOperation[]
  locale: string
}

export default function IcebergJourney({ operations, locale }: IcebergJourneyProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const lenisRef = useRef<Lenis | null>(null)
  const router = useRouter()
  const { reducedMotion, lowPower, noHover } = useIcebergPreferences()

  const scrollToTop = useCallback(() => {
    if (lenisRef.current) lenisRef.current.scrollTo(0, { duration: 2 })
    else window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const scrollToLevel = useCallback((level: number) => {
    const container = containerRef.current
    if (!container) return
    // useScrollCamera reparte los tramos en fracciones iguales del contenedor:
    // el nivel N queda justo donde acaba su transición de entrada.
    const fraction = (level - 1) / (ICEBERG_LEVELS.length - 1)
    const target = container.offsetTop + fraction * container.offsetHeight * 0.8

    if (lenisRef.current && !reducedMotion) lenisRef.current.scrollTo(target, { duration: 1.6 })
    else window.scrollTo({ top: target, behavior: reducedMotion ? 'instant' : 'smooth' })
  }, [reducedMotion])

  const handleSelect = useCallback(
    (operation: IcebergOperation) => {
      router.push(`/${locale}/catalog/${operation.slug}`)
    },
    [router, locale]
  )

  // Lenis smooth scroll + hide scrollbar for this page only
  useEffect(() => {
    const lenis = reducedMotion ? null : new Lenis({
      lerp: 0.08,
      smoothWheel: true,
    })
    lenisRef.current = lenis

    const rootStyle = document.documentElement.style
    const previousScrollbarWidth = rootStyle.getPropertyValue('scrollbar-width')
    const previousScrollbarPriority = rootStyle.getPropertyPriority('scrollbar-width')
    rootStyle.setProperty('scrollbar-width', 'none')
    const style = document.createElement('style')
    style.textContent = '::-webkit-scrollbar { display: none !important; } footer { background: #0a1628 !important; border-color: #0a1628 !important; color: rgba(255,255,255,0.5) !important; }'
    document.head.appendChild(style)

    let frameId: number | null = null
    const raf = (time: number) => {
      lenis?.raf(time)
      frameId = requestAnimationFrame(raf)
    }
    if (lenis) frameId = requestAnimationFrame(raf)

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId)
      lenis?.destroy()
      lenisRef.current = null
      if (previousScrollbarWidth) {
        rootStyle.setProperty('scrollbar-width', previousScrollbarWidth, previousScrollbarPriority)
      } else {
        rootStyle.removeProperty('scrollbar-width')
      }
      style.remove()
    }
  }, [reducedMotion])

  return (
    <div
      ref={containerRef}
      // 5 niveles repartidos por ~40 unidades de témpano: con 500vh el descenso
      // iba atropellado y cada tramo duraba una pantalla escasa.
      style={{ height: '800vh' }}
      className="relative"
    >
      {/* Sticky viewport — stays fixed while user scrolls through the 500vh track */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <IcebergCanvas
          scrollContainer={containerRef}
          operations={operations}
          locale={locale}
          onSelect={handleSelect}
          lowPower={lowPower}
          reducedMotion={reducedMotion}
          noHover={noHover}
        />
        <LevelLabel reducedMotion={reducedMotion} />
        <ClassifiedPanel operations={operations} />
        <ScrollDepthIndicator reducedMotion={reducedMotion} onSelectLevel={scrollToLevel} />
        <ScrollToTopButton onScrollToTop={scrollToTop} reducedMotion={reducedMotion} />
      </div>
    </div>
  )
}
