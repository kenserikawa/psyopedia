'use client'

import { useCallback, useSyncExternalStore } from 'react'

function useMediaQuery(query: string) {
  const subscribe = useCallback((onChange: () => void) => {
    const media = window.matchMedia(query)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

export function useIcebergPreferences() {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const mobile = useMediaQuery('(max-width: 767px), (pointer: coarse)')
  // Sin hover no hay expediente: ahí seleccionar y abrir tienen que ser dos
  // gestos distintos, o el primer toque se lleva al usuario de la página.
  const noHover = useMediaQuery('(hover: none)')

  return { reducedMotion, lowPower: mobile || reducedMotion, noHover }
}
