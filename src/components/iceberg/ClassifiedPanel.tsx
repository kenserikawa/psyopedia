'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { ICEBERG_LEVELS } from './constants'
import { useIcebergStore } from './useIcebergStore'
import type { IcebergOperation } from './OperationDot'

// Tiempo que se mantiene la ficha anterior al salir de un punto: evita que el
// panel parpadee al pasar el ratón entre dos puntos contiguos.
const HOLD_MS = 260

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-[11px] leading-snug">
      <span className="w-[4.5rem] shrink-0 font-mono text-[9px] uppercase tracking-[0.18em] text-white/40 pt-[2px]">
        {label}
      </span>
      <span className="text-white/75">{value}</span>
    </div>
  )
}

export default function ClassifiedPanel({ operations }: { operations: IcebergOperation[] }) {
  const t = useTranslations('iceberg')
  const tEnum = useTranslations('enums')
  const locale = useLocale()
  const hoveredId = useIcebergStore((s) => s.hoveredOperationId)
  // En táctil no hay hover: la ficha la sostiene la selección explícita.
  const selectedId = useIcebergStore((s) => s.selectedOperationId)
  const [display, setDisplay] = useState<IcebergOperation | null>(null)
  const [visible, setVisible] = useState(false)
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const activeId = hoveredId ?? selectedId
    const op = operations.find((o) => o.id === activeId) ?? null
    if (holdRef.current) clearTimeout(holdRef.current)

    if (op) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- transición de entrada/salida del panel
      setDisplay(op)
      setVisible(true)
    } else {
      setVisible(false)
      holdRef.current = setTimeout(() => setDisplay(null), HOLD_MS)
    }

    return () => {
      if (holdRef.current) clearTimeout(holdRef.current)
    }
  }, [hoveredId, selectedId, operations])

  if (!display) return null

  const types = (display.types ?? []).slice(0, 2).map((type) => tEnum(`type.${type}`))
  const actors = (display.actors ?? []).slice(0, 3)

  return (
    <div
      className="absolute bottom-24 right-6 w-80 md:right-12 pointer-events-none transition-all duration-300 ease-out motion-reduce:transition-none"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
      }}
    >
      <div className="border border-white/20 bg-black/45 backdrop-blur-sm font-serif text-white">
        {/* Cabecera del expediente */}
        <div className="flex items-baseline justify-between border-b border-white/15 px-4 py-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/50">
            {t('dossier.header')}
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
            {t('dossier.level')} {display.icebergLevel}/{ICEBERG_LEVELS.length}
          </p>
        </div>

        {/* Profundidad: los cinco niveles, con el actual encendido */}
        <div className="flex gap-1 px-4 pt-3">
          {ICEBERG_LEVELS.map((level) => (
            <span
              key={level.level}
              className="h-[2px] flex-1 transition-colors duration-300 motion-reduce:transition-none"
              style={{
                backgroundColor:
                  level.level <= display.icebergLevel
                    ? 'rgba(255,255,255,0.75)'
                    : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>

        <div className="px-4 py-3">
          <h3 className="text-lg leading-tight">{display.title}</h3>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-white/55">
            {tEnum(`era.${display.era}`)} · {tEnum(`status.${display.status}`)}
          </p>
          <p className="mt-1 text-[10px] italic text-white/40">
            {t(`levels.${display.icebergLevel}`)}
          </p>

          <p className="mt-3 text-[12px] leading-relaxed text-white/70">
            {display.excerpt.length > 190
              ? display.excerpt.slice(0, 190) + '…'
              : display.excerpt}
          </p>

          {(types.length > 0 || actors.length > 0 || display.outcome) && (
            <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
              {types.length > 0 && <MetaRow label={t('dossier.type')} value={types.join(' · ')} />}
              {actors.length > 0 && <MetaRow label={t('dossier.actors')} value={actors.join(' · ')} />}
              {display.outcome && (
                <MetaRow label={t('dossier.outcome')} value={tEnum(`outcome.${display.outcome}`)} />
              )}
            </div>
          )}
        </div>

        {/* Pie: respaldo documental y la única acción que sí navega */}
        <div className="flex items-center justify-between border-t border-white/15 px-4 py-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/40">
            {t('dossier.sources', { count: display.sourceCount ?? 0 })}
          </span>
          {/* Enlace de verdad, no una pista escrita: es la única forma de abrir
              la operación sin hover, y en escritorio da un objetivo grande.
              El contenedor es pointer-events-none; esto lo reactiva. */}
          <Link
            href={`/${locale}/catalog/${display.slug}`}
            className="pointer-events-auto font-mono text-[9px] uppercase tracking-[0.15em] text-sky-200/80 underline-offset-4 hover:text-sky-100 hover:underline focus-visible:text-sky-100 focus-visible:underline"
          >
            {t('dossier.open')} →
          </Link>
        </div>
      </div>
    </div>
  )
}
