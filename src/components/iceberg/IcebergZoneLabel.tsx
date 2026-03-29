'use client'

import { Html } from '@react-three/drei'

interface ZoneLabelProps {
  zone: { level: number; label: string; yMin: number; yMax: number }
  stats: { count: number; featured: string[] }
  visible: boolean
  onLevelClick: (level: number) => void
}

export default function IcebergZoneLabel({ zone, stats, visible, onLevelClick }: ZoneLabelProps) {
  const yCenter = (zone.yMin + zone.yMax) / 2

  return (
    <Html
      position={[4, yCenter, 0]}
      center
      distanceFactor={8}
      style={{
        pointerEvents: visible ? 'auto' : 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s',
      }}
    >
      <div
        className="bg-[#0a1628]/90 border border-blue-500/40 rounded-lg p-3 w-52 cursor-pointer backdrop-blur-sm shadow-lg shadow-blue-900/50"
        onClick={() => onLevelClick(zone.level)}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-blue-300">LEVEL {zone.level}</span>
          <span className="text-xs text-slate-400">{stats.count} ops</span>
        </div>
        <p className="text-xs text-blue-100 font-medium mb-2">{zone.label}</p>
        <ul className="space-y-0.5">
          {stats.featured.map((title) => (
            <li key={title} className="text-[11px] text-slate-400 truncate">- {title}</li>
          ))}
        </ul>
      </div>
    </Html>
  )
}
