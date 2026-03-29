'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { useIcebergInteraction } from './useIcebergInteraction'
import IcebergZoneLabel from './IcebergZoneLabel'

interface LevelStat {
  level: number
  count: number
  featured: string[]
  label: string
}

interface IcebergMeshProps {
  levelStats: LevelStat[]
  onLevelClick: (level: number) => void
}

const ZONES = [
  { level: 1, yMin: 0, yMax: 5, color: '#e0f4ff', glowColor: '#ffffff' },
  { level: 2, yMin: -2, yMax: 0, color: '#a8d8ea', glowColor: '#00cfff' },
  { level: 3, yMin: -4, yMax: -2, color: '#4a9fc4', glowColor: '#0088cc' },
  { level: 4, yMin: -6, yMax: -4, color: '#1e5f8a', glowColor: '#0044aa' },
  { level: 5, yMin: -10, yMax: -6, color: '#0a2a4a', glowColor: '#002288' },
]

// Generate iceberg profile points for LatheGeometry
function generateIcebergProfile(): THREE.Vector2[] {
  const points: THREE.Vector2[] = []

  // Above water: narrow jagged peak (Y: 0 to 5)
  points.push(new THREE.Vector2(0, 5))        // tip
  points.push(new THREE.Vector2(0.3, 4.5))
  points.push(new THREE.Vector2(0.5, 4.0))
  points.push(new THREE.Vector2(0.8, 3.5))
  points.push(new THREE.Vector2(0.6, 3.0))
  points.push(new THREE.Vector2(1.0, 2.5))
  points.push(new THREE.Vector2(1.2, 2.0))
  points.push(new THREE.Vector2(1.0, 1.5))
  points.push(new THREE.Vector2(1.4, 1.0))
  points.push(new THREE.Vector2(1.6, 0.5))
  points.push(new THREE.Vector2(1.8, 0.0))    // waterline

  // Below water: wide bulbous shape (Y: 0 to -10)
  points.push(new THREE.Vector2(2.2, -0.5))
  points.push(new THREE.Vector2(2.8, -1.0))
  points.push(new THREE.Vector2(3.2, -1.5))
  points.push(new THREE.Vector2(3.5, -2.0))
  points.push(new THREE.Vector2(3.8, -2.5))
  points.push(new THREE.Vector2(4.0, -3.0))
  points.push(new THREE.Vector2(4.1, -3.5))
  points.push(new THREE.Vector2(4.0, -4.0))
  points.push(new THREE.Vector2(3.8, -4.5))
  points.push(new THREE.Vector2(3.6, -5.0))
  points.push(new THREE.Vector2(3.5, -5.5))
  points.push(new THREE.Vector2(3.3, -6.0))
  points.push(new THREE.Vector2(3.0, -6.5))
  points.push(new THREE.Vector2(2.7, -7.0))
  points.push(new THREE.Vector2(2.3, -7.5))
  points.push(new THREE.Vector2(2.0, -8.0))
  points.push(new THREE.Vector2(1.6, -8.5))
  points.push(new THREE.Vector2(1.2, -9.0))
  points.push(new THREE.Vector2(0.7, -9.5))
  points.push(new THREE.Vector2(0, -10))       // bottom

  return points
}

// Get iceberg radius at a given Y position from the profile
function getRadiusAtY(profile: THREE.Vector2[], y: number): number {
  for (let i = 0; i < profile.length - 1; i++) {
    const p1 = profile[i]
    const p2 = profile[i + 1]
    if ((p1.y >= y && p2.y <= y) || (p1.y <= y && p2.y >= y)) {
      const t = (y - p1.y) / (p2.y - p1.y)
      return p1.x + t * (p2.x - p1.x)
    }
  }
  return 1
}

export default function IcebergMesh({ levelStats, onLevelClick }: IcebergMeshProps) {
  const { hoveredLevel, handleHover, handleClick } = useIcebergInteraction(onLevelClick)

  const profile = useMemo(() => generateIcebergProfile(), [])

  const geometry = useMemo(() => {
    return new THREE.LatheGeometry(profile, 32)
  }, [profile])

  return (
    <group>
      {/* Above-water iceberg */}
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#d4eeff"
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Underwater overlay with different material */}
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#1a6a9a"
          roughness={0.6}
          transparent
          opacity={0.75}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Zone bands (glowing rings at boundaries) */}
      {ZONES.map((zone) => {
        const radius = getRadiusAtY(profile, zone.yMax) + 0.1
        const isHovered = hoveredLevel === zone.level

        return (
          <group key={zone.level}>
            {/* Glowing ring at zone boundary */}
            <mesh position={[0, zone.yMax, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[radius, 0.05, 8, 64]} />
              <meshBasicMaterial
                color={zone.glowColor}
                transparent
                opacity={isHovered ? 0.9 : 0.4}
              />
            </mesh>

            {/* Invisible hit area for clicking */}
            <mesh
              position={[0, (zone.yMin + zone.yMax) / 2, 0]}
              onPointerEnter={() => handleHover(zone.level)}
              onPointerLeave={() => handleHover(null)}
              onPointerDown={() => handleClick(zone.level)}
            >
              <cylinderGeometry args={[
                getRadiusAtY(profile, zone.yMax) + 0.3,
                getRadiusAtY(profile, zone.yMin) + 0.3,
                Math.abs(zone.yMax - zone.yMin),
                32
              ]} />
              <meshBasicMaterial visible={false} />
            </mesh>

            {/* Zone label */}
            <IcebergZoneLabel
              zone={{ ...zone, label: levelStats.find(s => s.level === zone.level)?.label ?? '' }}
              stats={{
                count: levelStats.find(s => s.level === zone.level)?.count ?? 0,
                featured: levelStats.find(s => s.level === zone.level)?.featured ?? [],
              }}
              visible={hoveredLevel === zone.level}
              onLevelClick={onLevelClick}
            />
          </group>
        )
      })}
    </group>
  )
}
