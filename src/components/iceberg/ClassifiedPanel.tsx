'use client'

import { useEffect, useState } from 'react'
import { useIcebergStore } from './useIcebergStore'
import type { IcebergOperation } from './OperationDot'

const LEVEL_LABELS: Record<number, string> = {
  1: 'Well-Known', 2: 'Underappreciated', 3: 'Leaked', 4: 'Alleged', 5: 'Deep Conspiracy',
}

export default function ClassifiedPanel({ operations, locale }: { operations: IcebergOperation[]; locale: string }) {
  const hoveredId = useIcebergStore((s) => s.hoveredOperationId)
  const [display, setDisplay] = useState<IcebergOperation | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const op = operations.find((o) => o.id === hoveredId) ?? null
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirrors SidePanel transition pattern in IcebergScene.tsx
    if (op) { setDisplay(op); setVisible(true) }
    else setVisible(false)
  }, [hoveredId, operations])

  if (!display) return null
  return (
    <div
      className="absolute bottom-24 right-6 md:right-12 w-72 pointer-events-none transition-all duration-300"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(8px)' }}
    >
      <div className="border border-white/20 bg-black/40 backdrop-blur-sm p-4 font-serif text-white">
        <p className="text-[9px] font-mono tracking-[0.3em] uppercase text-white/50 mb-2">
          {locale === 'es' ? 'EXPEDIENTE' : 'CLASSIFIED FILE'} · NIVEL {display.icebergLevel}
        </p>
        <h3 className="text-lg leading-tight mb-1">{display.title}</h3>
        <p className="text-[10px] uppercase tracking-wider text-white/60 mb-2">
          {LEVEL_LABELS[display.icebergLevel]} · {display.status.replace('_', ' ')}
        </p>
        <p className="text-[12px] text-white/70 leading-relaxed">
          {display.excerpt.length > 180 ? display.excerpt.slice(0, 180) + '…' : display.excerpt}
        </p>
      </div>
    </div>
  )
}
