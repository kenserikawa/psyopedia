'use client'

import { useEffect, useRef } from 'react'
import { useIcebergStore } from './useIcebergStore'

interface ScrollToTopButtonProps {
  onScrollToTop: () => void
}

export default function ScrollToTopButton({ onScrollToTop }: ScrollToTopButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    return useIcebergStore.subscribe((state) => {
      if (!btnRef.current) return
      const visible = state.scrollProgress >= 0.35
      btnRef.current.style.opacity = visible ? '1' : '0'
      btnRef.current.style.pointerEvents = visible ? 'auto' : 'none'
      btnRef.current.style.transform = visible ? 'translateY(0)' : 'translateY(-12px)'
    })
  }, [])

  return (
    <button
      ref={btnRef}
      onClick={onScrollToTop}
      aria-label="Scroll to top"
      className="absolute top-6 right-6 z-10 flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-md border border-white/20 cursor-pointer"
      style={{
        opacity: 0,
        pointerEvents: 'none',
        transform: 'translateY(-12px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
        background: 'rgba(255,255,255,0.12)',
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-white/80"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  )
}
