'use client'

import { useCallback, useRef, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { labelFacingFade, levelFocus } from '@/lib/iceberg-geometry'
import { ICEBERG_LEVELS } from './constants'
import { registerLabel, unregisterLabel, type LabelEntry } from './labelRegistry'
import { useIcebergStore } from './useIcebergStore'

export interface IcebergOperation {
  id: string
  title: string
  excerpt: string
  era: string
  status: string
  slug: string
  icebergLevel: number
  // Ficha ampliada del panel de hover. Opcionales: IcebergScene monta el mismo
  // tipo con el conjunto mínimo de campos.
  types?: string[]
  outcome?: string
  actors?: string[]
  sourceCount?: number
}

interface OperationDotProps {
  operation: IcebergOperation
  position: [number, number, number]
  color: string
  isHovered: boolean
  levelDistance: number
  onHover: (id: string | null) => void
  onSelect: (operation: IcebergOperation) => void
  locale: string
  reducedMotion?: boolean
  /** Sitio dentro de la franja del nivel: escalona la entrada. */
  stagger?: number
}

// Tramos de scroll entre niveles.
const SEGMENTS = ICEBERG_LEVELS.length - 1

// Single shared geometry for all dots (biggest draw call saver).
// El radio está calibrado con el retranqueo de cámara de useScrollCamera: a esa
// distancia, 0.12 son ~13px de diámetro en pantalla.
const DOT_RADIUS = 0.12
const SHARED_SPHERE = new THREE.SphereGeometry(DOT_RADIUS, 12, 12)

// El tamaño en pantalla de la etiqueta es fuente × distanceFactor / distancia,
// así que el factor compensa el retranqueo de cámara. El offset deja libre el
// halo del punto, que ahora es mayor.
const LABEL_DISTANCE_FACTOR = 20
const LABEL_OFFSET_Y = 0.48

// Pre-compute level data
const LEVEL_DATA_MAP = new Map(ICEBERG_LEVELS.map((l) => [l.level as number, l]))

// Reusable vectors — zero allocations per frame
const _worldPos = new THREE.Vector3()
const _camDir = new THREE.Vector3()

function OperationDotInner({
  operation,
  position,
  color,
  isHovered,
  levelDistance,
  onHover,
  onSelect,
  locale,
  reducedMotion = false,
  stagger = 0,
}: OperationDotProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const coreRef = useRef<THREE.MeshStandardMaterial>(null)
  const haloRef = useRef<THREE.MeshBasicMaterial>(null)
  const labelEntry = useRef<LabelEntry | null>(null)

  // Ref callback: el div de la etiqueta se monta y desmonta con el nivel.
  const labelRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      labelEntry.current = registerLabel(operation.id, el)
    } else {
      unregisterLabel(operation.id)
      labelEntry.current = null
    }
  }, [operation.id])

  // Smooth animated values
  const hoverT = useRef(0)
  const frameSkip = useRef(0)

  const phaseY = position[1]

  useFrame(({ clock, camera }, delta) => {
    const clampedDelta = Math.min(delta, 0.05)

    hoverT.current += ((isHovered ? 1 : 0) - hoverT.current) * (reducedMotion ? 1 : clampedDelta * 8)
    const h = hoverT.current

    // Enfoque continuo a partir del scroll, no del nivel activo: durante la
    // transición los puntos del nivel que llega y del que se va se cruzan en
    // lugar de aparecer y desaparecer de golpe.
    const progress = useIcebergStore.getState().scrollProgress
    const focus = levelFocus(progress, operation.icebergLevel, SEGMENTS, stagger)

    // Core dot — scale + emissive
    if (meshRef.current) {
      const t = clock.getElapsedTime()
      meshRef.current.scale.setScalar(1.0 + focus * 0.3 + h * 0.4 + (reducedMotion ? 0 : Math.sin(t * 1.5 + phaseY) * 0.04 * focus))
    }
    if (coreRef.current) {
      coreRef.current.emissiveIntensity = 0.3 + focus * 0.7 + h * 1.0
      coreRef.current.opacity = 0.14 + focus * 0.86
    }
    if (haloRef.current) {
      haloRef.current.opacity = (0.06 + focus * 0.19) * (1 + h)
    }

    // La etiqueta no se pinta aquí: se publica lo que este punto pide y
    // LabelDeclutter arbitra los solapes antes de aplicarlo.
    const entry = labelEntry.current
    frameSkip.current++
    if (entry && meshRef.current && frameSkip.current % 3 === 0) {
      meshRef.current.getWorldPosition(_worldPos)
      _worldPos.y = 0
      _camDir.copy(camera.position).setY(0).normalize()
      const facing = _worldPos.normalize().dot(_camDir)
      const facingFade = labelFacingFade(facing)

      entry.opacity = focus * facingFade
      entry.blur = (1 - facingFade) * 3
      // El punto señalado nunca cede el sitio; el resto compite por lo centrado
      // que esté en su nivel y por lo de frente que quede.
      entry.priority = isHovered ? 10 : focus * facingFade
    }
  })

  // Pre-compute label data
  const levelData = LEVEL_DATA_MAP.get(operation.icebergLevel)
  const titleColor = levelData?.labelColor ?? '#0a1628'
  const metaColor = levelData?.subtitleColor ?? '#1a3a5c'
  // A partir del nivel 2 ya estás bajo el agua: rótulo claro sobre fondo oscuro,
  // así que la sombra tiene que ser oscura para despegarlo.
  const isDark = operation.icebergLevel >= 2
  const shadowColor = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)'

  // Se monta también el nivel contiguo para poder cruzar el fundido; más lejos
  // no hay nada que mostrar y el DOM se ahorra las etiquetas.
  const showLabel = levelDistance <= 1

  return (
    <group position={position}>
      {/* Single mesh per dot — no glow/ring meshes */}
      <mesh ref={meshRef} geometry={SHARED_SPHERE}>
        <meshStandardMaterial
          ref={coreRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={1}
        />
      </mesh>

      {/* Halo additive — también hace de zona de clic, 2.2× el núcleo */}
      <mesh
        scale={2.2}
        onPointerEnter={(e) => {
          e.stopPropagation()
          onHover(operation.id)
          useIcebergStore.getState().setHoveredDotPosition(position)
        }}
        onPointerLeave={() => {
          onHover(null)
          useIcebergStore.getState().setHoveredDotPosition(null)
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(operation)
        }}
      >
        <sphereGeometry args={[DOT_RADIUS, 16, 16]} />
        <meshBasicMaterial ref={haloRef} color={color} transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Label — only active level */}
      {showLabel && (
        <Html
          center
          distanceFactor={LABEL_DISTANCE_FACTOR}
          style={{ pointerEvents: 'none' }}
          position={[0, LABEL_OFFSET_Y, 0]}
        >
          <div
            ref={labelRef}
            style={{
              // Arranca oculta: el bucle de render fija el valor real en el
              // primer frame y así no parpadea al montarse.
              visibility: 'hidden',
              opacity: 0,
              willChange: 'filter, opacity',
            }}
          >
            {/* Solo el título: la ficha completa vive en el panel de hover, que
                no compite con el iceberg ni se amontona con las vecinas. */}
            <p
              className="text-[16px] font-semibold leading-tight whitespace-nowrap"
              style={{ color: titleColor, textShadow: `0 1px 3px ${shadowColor}` }}
            >
              {operation.title}
            </p>
            {isHovered && (
              <span
                className="mt-0.5 block text-[12px] font-medium"
                style={{ color: metaColor, textShadow: `0 1px 2px ${shadowColor}` }}
              >
                {locale === 'es' ? 'Clic para abrir →' : 'Click to open →'}
              </span>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

const OperationDot = memo(OperationDotInner)
export default OperationDot
