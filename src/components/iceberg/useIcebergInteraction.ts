import { useState, useCallback } from 'react'

export function useIcebergInteraction(onLevelClick: (level: number) => void) {
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null)

  const handleHover = useCallback((level: number | null) => {
    setHoveredLevel(level)
    document.body.style.cursor = level !== null ? 'pointer' : 'default'
  }, [])

  const handleClick = useCallback((level: number) => {
    onLevelClick(level)
  }, [onLevelClick])

  return { hoveredLevel, handleHover, handleClick }
}
