# Iceberg Journey "Descenso Clasificado" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar el journey 3D del iceberg (`/[locale]/iceberg`) como un descenso cinematográfico "clasificado": iceberg procedural con shader de hielo (elimina el GLB de 74 MB), atmósfera reactiva a la profundidad, postprocesado (DOF/grano/viñeta/aberración cromática), cámara con easing cinematográfico + parallax, y dots reactivos.

**Architecture:** Se conservan los huesos del journey (`IcebergJourney` sticky 500vh + Lenis + `useScrollCamera` con ScrollTrigger + store Zustand como única fuente de verdad de `scrollProgress`/`activeLevel`). Se reemplaza la geometría GLB por geometría procedural desplazada con SimplexNoise (CPU, facetada) y `MeshTransmissionMaterial`. Cada capa visual (material, atmósfera, postFX, partículas) lee `scrollProgress` del store y muestrea una tabla de niveles interpolada centralizada (`sampleLevels()`), evitando estado duplicado.

**Tech Stack:** Next.js 16 (App Router, `"use client"`), React Three Fiber 9.5, drei 10.7 (`MeshTransmissionMaterial`, `Sparkles`, `PerformanceMonitor`), `@react-three/postprocessing` 3.0.4, three 0.183 (`SimplexNoise` desde `three/addons`), GSAP 3.14 (`ScrollTrigger`, `CustomEase`), Lenis, Zustand 5, framer-motion.

## Global Constraints

- Todos los componentes del iceberg son client components (`"use client"` al inicio del archivo).
- **0 MB de modelo en el bundle**: prohibido `useGLTF('/iceberg-long.glb')` o cualquier referencia al GLB tras la Fase 1.
- No añadir dependencias nuevas: `SimplexNoise` viene de `three/addons/math/SimplexNoise.js`; todo lo demás ya está instalado.
- Fuente de verdad única del progreso: `useIcebergStore` (`scrollProgress` 0→1, `activeLevel` 1→5). No duplicar.
- i18n: los componentes con texto reciben y respetan `locale` (`"en"` | `"es"`).
- Rendimiento objetivo: ≥ 50 FPS en desktop de gama media, ≥ 30 FPS en móvil (ruta degradada vía prop `lowPower`).
- **Verificación (sin framework de tests):** cada tarea termina con `npm run lint` y `npm run build` en verde **y** una comprobación visual concreta descrita en la tarea. Usa el dev server (`npm run dev`, puerto 3000) y, si está disponible, capturas vía el MCP de navegador.
- Commits frecuentes y atómicos: uno por tarea como mínimo. Mensajes en el estilo del repo (`feat:`/`refactor:`/`style:`). Trabajar en la rama actual `master`.

---

## File Structure

| Archivo | Responsabilidad | Acción |
|---------|-----------------|--------|
| `src/components/iceberg/constants.ts` | Config de 5 niveles + tabla visual + `sampleLevels()` | Modificar |
| `src/components/iceberg/levelSampling.ts` | Tipo `InterpolatedLevel` + interpolación pura | Crear |
| `src/components/iceberg/useIcebergStore.ts` | Store: añadir `hoveredDotPosition` | Modificar |
| `src/components/iceberg/ProceduralIceberg.tsx` | Geometría procedural + shader de hielo + fresnel rim | Crear |
| `src/components/iceberg/IcebergMesh.tsx` | Grupo: iceberg + dots + rotación; hover al store | Modificar |
| `src/components/iceberg/DepthAtmosphere.tsx` | Niebla + `scene.background` reactivos + luces | Modificar |
| `src/components/iceberg/DriftParticles.tsx` | Plancton/sedimento a la deriva | Crear |
| `src/components/iceberg/LightShafts.tsx` | God rays / haces de luz en superficie | Crear |
| `src/components/iceberg/PostFX.tsx` | EffectComposer: bloom, DOF, viñeta, grano, CA | Crear |
| `src/components/iceberg/MouseParallax.tsx` | Offset de cámara amortiguado por ratón | Crear |
| `src/components/iceberg/useScrollCamera.ts` | Cámara: CustomEase + dolly/roll | Modificar |
| `src/components/iceberg/IcebergCanvas.tsx` | Ensambla escena + `PerformanceMonitor` + `lowPower` | Modificar |
| `src/components/iceberg/OperationDot.tsx` | Dot con halo shader; escribe hover al store | Modificar |
| `src/components/iceberg/ClassifiedPanel.tsx` | Panel "ficha clasificada" (overlay 2D) | Crear |
| `src/components/iceberg/IcebergJourney.tsx` | Monta el panel; quita override de fondo CSS | Modificar |

---

## Task 0: Tabla de niveles interpolada + store

Centraliza todos los parámetros visuales por profundidad en una sola tabla y una función de muestreo pura, para que cada capa (material, atmósfera, postFX) lea de la misma fuente.

**Files:**
- Modify: `src/components/iceberg/constants.ts`
- Create: `src/components/iceberg/levelSampling.ts`
- Modify: `src/components/iceberg/useIcebergStore.ts`

**Interfaces:**
- Produces:
  - `ICEBERG_LEVELS[i]` extendido con: `bgColor: string`, `iceColor: string`, `iceRoughness: number`, `iceThickness: number`, `grain: number`, `chromaticAberration: number`, `vignette: number`, `godRayIntensity: number`, `particleDensity: number`.
  - `type InterpolatedLevel = { fogDensity:number; fogColor:THREE.Color; bgColor:THREE.Color; iceColor:THREE.Color; iceRoughness:number; iceThickness:number; ambientIntensity:number; grain:number; chromaticAberration:number; vignette:number; godRayIntensity:number; particleDensity:number }`
  - `function sampleLevels(progress: number): InterpolatedLevel` (interpola linealmente entre los dos niveles que rodean `progress ∈ [0,1]`).
  - Store: `hoveredDotPosition: [number, number, number] | null` + `setHoveredDotPosition(pos)`.

- [ ] **Step 1: Extender `ICEBERG_LEVELS` en `constants.ts`** — añadir los campos visuales a cada uno de los 5 objetos. Valores (superficie → abismo):

```ts
// Añadir estos campos a cada nivel del array ICEBERG_LEVELS, respetando el orden 1..5.
// Nivel 1 (Surface):
  bgColor: "#eaf6ff", iceColor: "#dff1ff", iceRoughness: 0.05, iceThickness: 1.2,
  grain: 0.015, chromaticAberration: 0.0006, vignette: 0.25, godRayIntensity: 1.0, particleDensity: 0.15,
// Nivel 2 (Shallow):
  bgColor: "#9fcfe6", iceColor: "#b9e1f5", iceRoughness: 0.12, iceThickness: 1.6,
  grain: 0.03, chromaticAberration: 0.0010, vignette: 0.35, godRayIntensity: 0.6, particleDensity: 0.4,
// Nivel 3 (Midwater):
  bgColor: "#2e6f97", iceColor: "#6fb2d6", iceRoughness: 0.22, iceThickness: 2.2,
  grain: 0.05, chromaticAberration: 0.0016, vignette: 0.5, godRayIntensity: 0.25, particleDensity: 0.7,
// Nivel 4 (Deep):
  bgColor: "#11314f", iceColor: "#3f6f93", iceRoughness: 0.35, iceThickness: 3.0,
  grain: 0.075, chromaticAberration: 0.0024, vignette: 0.7, godRayIntensity: 0.08, particleDensity: 0.9,
// Nivel 5 (Abyss):
  bgColor: "#040910", iceColor: "#1c3a55", iceRoughness: 0.5, iceThickness: 4.0,
  grain: 0.11, chromaticAberration: 0.0034, vignette: 0.9, godRayIntensity: 0.0, particleDensity: 1.0,
```

- [ ] **Step 2: Crear `levelSampling.ts`** con el tipo y la función pura de muestreo:

```ts
import * as THREE from "three";
import { ICEBERG_LEVELS } from "./constants";

export interface InterpolatedLevel {
  fogDensity: number;
  fogColor: THREE.Color;
  bgColor: THREE.Color;
  iceColor: THREE.Color;
  iceRoughness: number;
  iceThickness: number;
  ambientIntensity: number;
  grain: number;
  chromaticAberration: number;
  vignette: number;
  godRayIntensity: number;
  particleDensity: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Reusable target so callers can pass one in and avoid per-frame allocations.
export function sampleLevels(progress: number, out?: InterpolatedLevel): InterpolatedLevel {
  const segments = ICEBERG_LEVELS.length - 1; // 4
  const p = Math.min(Math.max(progress, 0), 1);
  const idx = Math.min(Math.floor(p * segments), segments - 1);
  const t = p * segments - idx;
  const a = ICEBERG_LEVELS[idx];
  const b = ICEBERG_LEVELS[idx + 1];

  const r = out ?? ({
    fogColor: new THREE.Color(), bgColor: new THREE.Color(),
    iceColor: new THREE.Color(),
  } as InterpolatedLevel);

  r.fogDensity = lerp(a.fogDensity, b.fogDensity, t);
  r.fogColor.set(a.accentColor).lerp(new THREE.Color(b.accentColor), t);
  r.bgColor.set(a.bgColor).lerp(new THREE.Color(b.bgColor), t);
  r.iceColor.set(a.iceColor).lerp(new THREE.Color(b.iceColor), t);
  r.iceRoughness = lerp(a.iceRoughness, b.iceRoughness, t);
  r.iceThickness = lerp(a.iceThickness, b.iceThickness, t);
  r.ambientIntensity = lerp(a.ambientIntensity, b.ambientIntensity, t);
  r.grain = lerp(a.grain, b.grain, t);
  r.chromaticAberration = lerp(a.chromaticAberration, b.chromaticAberration, t);
  r.vignette = lerp(a.vignette, b.vignette, t);
  r.godRayIntensity = lerp(a.godRayIntensity, b.godRayIntensity, t);
  r.particleDensity = lerp(a.particleDensity, b.particleDensity, t);
  return r;
}
```

- [ ] **Step 3: Extender el store** — en `useIcebergStore.ts` añadir el campo y el setter:

```ts
// dentro de la interfaz IcebergStore:
  hoveredDotPosition: [number, number, number] | null;
  setHoveredDotPosition: (pos: [number, number, number] | null) => void;
// dentro de create(...):
  hoveredDotPosition: null,
  setHoveredDotPosition: (pos) => set({ hoveredDotPosition: pos }),
```

- [ ] **Step 4: Verificar** — `npm run lint` (sin errores nuevos) y `npm run build` (compila; `as const` en `ICEBERG_LEVELS` sigue válido con los campos nuevos). Si TypeScript se queja del `as const` con `THREE.Color`, confirma que `sampleLevels` lee `accentColor`/`bgColor` como string (lo son).

- [ ] **Step 5: Commit**

```bash
git add src/components/iceberg/constants.ts src/components/iceberg/levelSampling.ts src/components/iceberg/useIcebergStore.ts
git commit -m "feat(iceberg): tabla de niveles visual interpolada (sampleLevels) + hoveredDotPosition en store"
```

---

## Task 1: Iceberg procedural — geometría facetada (elimina el GLB)

Reemplaza el modelo GLB de 74 MB por geometría generada y desplazada con ruido. En esta tarea usa un material estándar temporal para validar **la forma**; el shader de hielo llega en la Task 2.

**Files:**
- Create: `src/components/iceberg/ProceduralIceberg.tsx`
- Modify: `src/components/iceberg/IcebergMesh.tsx` (líneas 102-122 `IcebergModel`/`useGLTF`, y 196-197 el render)

**Interfaces:**
- Consumes: nada de tasks previas (geometría autónoma).
- Produces: `export default function ProceduralIceberg(props: { lowPower?: boolean })` — un `<group>` con el mesh del iceberg centrado en el origen, parte emergida sobre `y=0` y masa sumergida estirada hacia `-y` (regla ~1:6). Escala/posición pensadas para encajar con los `LEVEL_Y_RANGE` actuales de los dots.

- [ ] **Step 1: Crear `ProceduralIceberg.tsx`** con geometría desplazada por SimplexNoise (CPU, facetada con `toNonIndexed` + `computeVertexNormals`). Material temporal `meshStandardMaterial`:

```tsx
'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js'

interface ProceduralIcebergProps {
  lowPower?: boolean
}

// Construye una geometría de iceberg: icosaedro subdividido, desplazado con FBM,
// estirado y afilado hacia abajo para la masa sumergida (regla del iceberg).
function buildIcebergGeometry(lowPower: boolean): THREE.BufferGeometry {
  const detail = lowPower ? 4 : 6
  const geo = new THREE.IcosahedronGeometry(2, detail)
  const simplex = new SimplexNoise()
  const pos = geo.attributes.position
  const v = new THREE.Vector3()

  // FBM: varias octavas de simplex
  const fbm = (x: number, y: number, z: number) => {
    let amp = 1, freq = 0.9, sum = 0, norm = 0
    for (let o = 0; o < 4; o++) {
      sum += amp * simplex.noise3d(x * freq, y * freq, z * freq)
      norm += amp
      amp *= 0.5
      freq *= 2.1
    }
    return sum / norm
  }

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const dir = v.clone().normalize()
    const n = fbm(dir.x, dir.y, dir.z) // -1..1

    // Desplazamiento facetado del relieve
    let r = 2 + n * 0.55

    // Masa sumergida: estirar e ir afilando por debajo de y=0
    if (dir.y < 0) {
      const d = -dir.y // 0..1
      v.multiplyScalar(r)
      v.y *= 1 + d * 5.0          // estira hacia abajo (~6x de profundidad)
      const taper = 1 - d * 0.45  // afila el fondo
      v.x *= taper
      v.z *= taper
    } else {
      v.multiplyScalar(r)
      v.y *= 1.1 // pico ligeramente más alto
    }
    pos.setXYZ(i, v.x, v.y, v.z)
  }

  geo.computeBoundingBox()
  // Facetas: sin índice + normales por cara
  const flat = geo.toNonIndexed()
  flat.computeVertexNormals()
  geo.dispose()
  return flat
}

export default function ProceduralIceberg({ lowPower = false }: ProceduralIcebergProps) {
  const geometry = useMemo(() => buildIcebergGeometry(lowPower), [lowPower])

  return (
    <group position={[0, -3, 0]} scale={1.4}>
      <mesh geometry={geometry}>
        {/* Material temporal — se reemplaza por hielo en la Task 2 */}
        <meshStandardMaterial color="#bfe4f7" roughness={0.15} metalness={0.05} flatShading />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 2: Quitar el GLB de `IcebergMesh.tsx`** — borrar la función `IcebergModel` (líneas 102-120), la línea `useGLTF.preload('/iceberg-long.glb')` (122), y el import `useGLTF` (línea 5 → quitar de `@react-three/drei`). Importar el nuevo componente:

```tsx
// arriba, junto a los demás imports:
import ProceduralIceberg from './ProceduralIceberg'
```

- [ ] **Step 3: Renderizar el iceberg procedural** — en el JSX de `IcebergMesh` (línea ~196-197) sustituir `<IcebergModel />` por:

```tsx
      {/* Iceberg procedural (reemplaza el GLB de 74 MB) */}
      <ProceduralIceberg />
```

- [ ] **Step 4: Verificación visual** — `npm run dev`, abrir `http://localhost:3000/es/iceberg`. Debe verse un iceberg facetado, con una masa clara emergida y una mole mayor descendiendo hacia abajo; al hacer scroll la cámara desciende junto a él; los dots siguen apareciendo por nivel. No debe haber petición de red a `iceberg-long.glb` (revisar pestaña Network). Ajustar `position`/`scale` del `<group>` si los dots quedan descolocados respecto al cuerpo.

- [ ] **Step 5: Verificar build/lint** — `npm run lint` y `npm run build` en verde. Confirmar que no quedan referencias a `useGLTF` ni a `iceberg-long.glb` en `src/`: `grep -rn "iceberg-long\|useGLTF" src/components/iceberg/` no devuelve nada.

- [ ] **Step 6: Commit**

```bash
git add src/components/iceberg/ProceduralIceberg.tsx src/components/iceberg/IcebergMesh.tsx
git commit -m "feat(iceberg): iceberg procedural facetado con SimplexNoise; elimina el GLB de 74MB del journey"
```

---

## Task 2: Shader de hielo (transmisión + fresnel + profundidad) — GATE DE RIESGO

Da al iceberg su materialidad de hielo: translucidez/refracción con `MeshTransmissionMaterial`, borde fresnel glacial, y parámetros que se oscurecen con la profundidad leyendo `sampleLevels()`.

**Este es el riesgo principal del proyecto.** Tras esta tarea, decisión explícita: si el resultado convence, seguir; si no, fallback a "optimizar el GLB" (ver Task 2b) — las Tasks 3-7 son idénticas en ambos caminos.

**Files:**
- Modify: `src/components/iceberg/ProceduralIceberg.tsx`

**Interfaces:**
- Consumes: `sampleLevels` de `levelSampling.ts`; `useIcebergStore.getState().scrollProgress`.
- Produces: mismo export `ProceduralIceberg({ lowPower })`; ahora con material de hielo reactivo.

- [ ] **Step 1: Sustituir el material temporal** por `MeshTransmissionMaterial` + un rim fresnel additive en un segundo mesh. Reescribir el return y añadir el `useFrame` reactivo:

```tsx
'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js'
import { sampleLevels, type InterpolatedLevel } from './levelSampling'
import { useIcebergStore } from './useIcebergStore'

interface ProceduralIcebergProps {
  lowPower?: boolean
}

// ...buildIcebergGeometry sin cambios (de la Task 1)...

// Material fresnel additive para el borde glacial (rim light frío).
function makeRimMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide,
    uniforms: {
      uColor: { value: new THREE.Color('#bfe9ff') },
      uPower: { value: 2.5 },
      uIntensity: { value: 0.6 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormalW;
      varying vec3 vViewDir;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uPower; uniform float uIntensity;
      varying vec3 vNormalW; varying vec3 vViewDir;
      void main() {
        float fres = pow(1.0 - max(dot(normalize(vNormalW), normalize(vViewDir)), 0.0), uPower);
        gl_FragColor = vec4(uColor * fres * uIntensity, fres);
      }
    `,
  })
}

export default function ProceduralIceberg({ lowPower = false }: ProceduralIcebergProps) {
  const geometry = useMemo(() => buildIcebergGeometry(lowPower), [lowPower])
  const rimMaterial = useMemo(() => makeRimMaterial(), [])
  // MeshTransmissionMaterial no exporta un tipo público estable: ref laxo.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matRef = useRef<any>(null)
  const sample = useRef<InterpolatedLevel>(sampleLevels(0))

  useFrame((_, delta) => {
    const progress = useIcebergStore.getState().scrollProgress
    sampleLevels(progress, sample.current)
    const s = sample.current
    if (matRef.current) {
      // Lerp suave para evitar saltos
      const k = Math.min(delta * 4, 1)
      matRef.current.color.lerp(s.iceColor, k)
      matRef.current.roughness += (s.iceRoughness - matRef.current.roughness) * k
      matRef.current.thickness += (s.iceThickness - matRef.current.thickness) * k
    }
    // El rim se apaga con la profundidad
    rimMaterial.uniforms.uIntensity.value = 0.15 + s.godRayIntensity * 0.6
  })

  return (
    <group position={[0, -3, 0]} scale={1.4}>
      <mesh geometry={geometry}>
        <MeshTransmissionMaterial
          ref={matRef}
          transmission={lowPower ? 0.6 : 1}
          thickness={1.2}
          roughness={0.08}
          ior={1.31}
          chromaticAberration={0.04}
          anisotropy={0.1}
          distortion={0.2}
          distortionScale={0.3}
          temporalDistortion={0.1}
          samples={lowPower ? 4 : 8}
          resolution={lowPower ? 256 : 512}
          color="#dff1ff"
          attenuationColor="#9fd6f0"
          attenuationDistance={4}
          background={undefined}
        />
      </mesh>
      {/* Borde fresnel glacial */}
      <mesh geometry={geometry} material={rimMaterial} scale={1.015} />
    </group>
  )
}
```

- [ ] **Step 2: Verificación visual del look de hielo** — `npm run dev`, `/es/iceberg`. Arriba debe leerse como hielo translúcido claro con borde brillante; al descender debe oscurecerse, enturbiarse y perder el rim. **Afinado esperado** (no es placeholder: ajustar uniforms observando el resultado): si parece plástico, subir `ior`/`attenuationDistance` y bajar `roughness`; si parece opaco, subir `transmission`. Capturar superficie y abismo para comparar.

- [ ] **Step 3: Verificar build/lint** — `npm run lint` y `npm run build` en verde.

- [ ] **Step 4: DECISIÓN DE GATE** — ¿el iceberg se lee como hielo de forma convincente? Si **sí**, continuar a Task 3. Si **no** tras un afinado razonable, ejecutar Task 2b (fallback GLB) y luego continuar a Task 3 (idéntica). Registrar la decisión en el commit.

- [ ] **Step 5: Commit**

```bash
git add src/components/iceberg/ProceduralIceberg.tsx
git commit -m "feat(iceberg): shader de hielo (MeshTransmissionMaterial + fresnel rim) reactivo a la profundidad"
```

---

## Task 2b (CONDICIONAL — solo si falla el gate de la Task 2): optimizar el GLB

Camino de fallback: conservar el modelo original pero comprimido, manteniendo el resto del plan.

**Files:**
- Modify: `src/components/iceberg/ProceduralIceberg.tsx` → renombrar conceptualmente a cargar GLB comprimido, o revertir `IcebergMesh` a `useGLTF` apuntando al GLB optimizado.

- [ ] **Step 1: Comprimir el modelo** con gltf-transform (Draco + reescalado de texturas):

```bash
npx @gltf-transform/cli optimize public/iceberg-long.glb public/iceberg-opt.glb --compress draco --texture-compress webp --texture-size 1024
```
Expected: archivo `public/iceberg-opt.glb` de ~2-6 MB (verificar `ls -lh public/iceberg-opt.glb`).

- [ ] **Step 2: Cargar el GLB optimizado** restaurando `IcebergModel` en `IcebergMesh.tsx` pero con `useGLTF('/iceberg-opt.glb')` + `useGLTF.preload('/iceberg-opt.glb')`, y aplicando `MeshTransmissionMaterial` al traverse en lugar del material original.

- [ ] **Step 3: Borrar el GLB pesado** `git rm public/iceberg-long.glb` (solo tras confirmar que `iceberg-opt.glb` funciona).

- [ ] **Step 4: Verificar y commit** — lint + build + visual; `git commit -m "fallback(iceberg): GLB comprimido (draco+webp) con material de hielo; ~74MB→Xmb"`.

---

## Task 3: Atmósfera reactiva (fondo en escena + partículas + god rays)

Mueve el gradiente al canvas (para que niebla/DOF/grano se integren), añade partículas a la deriva y haces de luz en superficie. Todo modulado por profundidad.

**Files:**
- Modify: `src/components/iceberg/DepthAtmosphere.tsx`
- Create: `src/components/iceberg/DriftParticles.tsx`
- Create: `src/components/iceberg/LightShafts.tsx`
- Modify: `src/components/iceberg/IcebergCanvas.tsx` (montar los nuevos componentes)
- Modify: `src/components/iceberg/IcebergJourney.tsx` (quitar el gradiente CSS de fondo, líneas 62-63)

**Interfaces:**
- Consumes: `sampleLevels`, `useIcebergStore`.
- Produces: `export default function DriftParticles(props:{lowPower?:boolean})`, `export default function LightShafts()`.

- [ ] **Step 1: `DepthAtmosphere` controla `scene.background`** — reemplazar el cuerpo del `useFrame` para usar `sampleLevels` y setear fondo + niebla con la misma fuente. Sustituir las líneas 22-54:

```tsx
import { sampleLevels, type InterpolatedLevel } from './levelSampling'
// ...
  // Initialize fog + background
  useEffect(() => {
    scene.fog = new THREE.FogExp2('#eaf6ff', ICEBERG_LEVELS[0].fogDensity)
    scene.background = new THREE.Color('#eaf6ff')
  }, [scene])

  const sample = useRef<InterpolatedLevel>(sampleLevels(0))
  useFrame(() => {
    const s = sampleLevels(progressRef.current, sample.current)
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.density = s.fogDensity
      scene.fog.color.copy(s.fogColor)
    }
    if (scene.background instanceof THREE.Color) scene.background.copy(s.bgColor)
    if (ambientRef.current) ambientRef.current.intensity = s.ambientIntensity
  })
```
Quitar el `pointRef` color-lerp si ya no se usa (mantener las luces de los `return`).

- [ ] **Step 2: Canvas opaco** — en `IcebergCanvas.tsx` (líneas 62-65) cambiar `gl={{ antialias: true, alpha: true }}` por `gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}` y quitar `style={{ background: 'transparent' }}` (el fondo ahora lo da `scene.background`).

- [ ] **Step 3: Quitar el gradiente CSS** en `IcebergJourney.tsx` — la `className` del div raíz (línea 63) pasa de `relative bg-gradient-to-b ...` a solo `relative`. El fondo lo pinta la escena.

- [ ] **Step 4: Crear `DriftParticles.tsx`** con `Sparkles` de drei, densidad/opacidad por profundidad:

```tsx
'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { sampleLevels } from './levelSampling'
import { useIcebergStore } from './useIcebergStore'

export default function DriftParticles({ lowPower = false }: { lowPower?: boolean }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null)
  useFrame(() => {
    const s = sampleLevels(useIcebergStore.getState().scrollProgress)
    if (ref.current?.material) {
      ref.current.material.opacity = 0.2 + s.particleDensity * 0.8
    }
  })
  return (
    <Sparkles
      ref={ref}
      count={lowPower ? 120 : 350}
      scale={[14, 26, 14]}
      position={[0, -6, 0]}
      size={3}
      speed={0.25}
      opacity={0.5}
      color="#cfeeff"
      noise={1}
    />
  )
}
```

- [ ] **Step 5: Crear `LightShafts.tsx`** — haces de luz volumétrica fake (planos additive) que se desvanecen al bajar:

```tsx
'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sampleLevels } from './levelSampling'
import { useIcebergStore } from './useIcebergStore'

export default function LightShafts() {
  const groupRef = useRef<THREE.Group>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uIntensity: { value: 1 }, uColor: { value: new THREE.Color('#bfe6ff') } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
        `,
        fragmentShader: /* glsl */ `
          uniform float uIntensity; uniform vec3 uColor; varying vec2 vUv;
          void main(){
            float horiz = smoothstep(0.0,0.25,vUv.x) * smoothstep(1.0,0.75,vUv.x);
            float vert = smoothstep(0.0,0.6,1.0 - vUv.y);
            gl_FragColor = vec4(uColor, horiz * vert * 0.25 * uIntensity);
          }
        `,
      }),
    []
  )

  useFrame(({ clock }) => {
    const s = sampleLevels(useIcebergStore.getState().scrollProgress)
    if (matRef.current) matRef.current.uniforms.uIntensity.value = s.godRayIntensity
    if (groupRef.current) groupRef.current.rotation.y = clock.getElapsedTime() * 0.03
  })

  // Varios planos verticales rotados, anclados en la superficie (y≈4)
  const shafts = [0, 1, 2, 3, 4]
  return (
    <group ref={groupRef} position={[0, 4, 0]}>
      {shafts.map((i) => (
        <mesh key={i} rotation={[0, (i / shafts.length) * Math.PI * 2, 0.15]} position={[0, 0, 0]}>
          <planeGeometry args={[6, 16]} />
          <primitive object={material} ref={i === 0 ? matRef : undefined} attach="material" />
        </mesh>
      ))}
    </group>
  )
}
```

- [ ] **Step 6: Montar atmósfera en `IcebergCanvas.tsx`** — dentro de `SceneContent` (junto a `<DepthAtmosphere />`):

```tsx
import DriftParticles from './DriftParticles'
import LightShafts from './LightShafts'
// ...
      <DepthAtmosphere />
      <LightShafts />
      <DriftParticles />
```

- [ ] **Step 7: Verificación visual** — `/es/iceberg`: en superficie se ven haces de luz desde arriba y partículas escasas; al descender, los haces desaparecen, las partículas se densifican y el fondo pasa de cian claro a azul oscuro a negro, integrado con la niebla. Sin borde duro entre canvas y página.

- [ ] **Step 8: lint + build + Commit**

```bash
git add src/components/iceberg/DepthAtmosphere.tsx src/components/iceberg/DriftParticles.tsx src/components/iceberg/LightShafts.tsx src/components/iceberg/IcebergCanvas.tsx src/components/iceberg/IcebergJourney.tsx
git commit -m "feat(iceberg): atmósfera reactiva — fondo en escena, partículas a la deriva y god rays por profundidad"
```

---

## Task 4: Postprocesado cinematográfico

Añade el `EffectComposer` que hoy no existe en el journey: bloom, DOF (enfoca el iceberg / el dot activo), viñeta, grano y aberración cromática, todo modulado por profundidad.

**Files:**
- Create: `src/components/iceberg/PostFX.tsx`
- Modify: `src/components/iceberg/IcebergCanvas.tsx`

**Interfaces:**
- Consumes: `sampleLevels`, `useIcebergStore` (`scrollProgress`, `hoveredDotPosition`).
- Produces: `export default function PostFX(props:{lowPower?:boolean})`.

- [ ] **Step 1: Crear `PostFX.tsx`**:

```tsx
'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  EffectComposer, Bloom, DepthOfField, Vignette, Noise, ChromaticAberration,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { sampleLevels } from './levelSampling'
import { useIcebergStore } from './useIcebergStore'

export default function PostFX({ lowPower = false }: { lowPower?: boolean }) {
  const { camera } = useThree()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dofRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vignetteRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const noiseRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const caRef = useRef<any>(null)
  const _focusTarget = useRef(new THREE.Vector3(0, -3, 0))

  useFrame(() => {
    const state = useIcebergStore.getState()
    const s = sampleLevels(state.scrollProgress)

    // Foco del DOF: el dot hovered, o el centro del iceberg a la altura de cámara
    if (state.hoveredDotPosition) _focusTarget.current.set(...state.hoveredDotPosition)
    else _focusTarget.current.set(0, camera.position.y - 1.5, 0)
    const dist = camera.position.distanceTo(_focusTarget.current)
    if (dofRef.current) dofRef.current.circleOfConfusionMaterial.uniforms.focusDistance.value =
      dist / 50 // normalizado aprox.; afinar visualmente

    if (vignetteRef.current) vignetteRef.current.darkness = s.vignette
    if (noiseRef.current) noiseRef.current.blendMode.opacity.value = s.grain
    if (caRef.current) caRef.current.offset.set(s.chromaticAberration, s.chromaticAberration)
  })

  return (
    <EffectComposer multisampling={lowPower ? 0 : 2}>
      <Bloom luminanceThreshold={0.65} intensity={0.6} radius={0.5} mipmapBlur />
      {lowPower ? <></> : (
        <DepthOfField ref={dofRef} focusDistance={0.02} focalLength={0.05} bokehScale={3} />
      )}
      <ChromaticAberration ref={caRef} blendFunction={BlendFunction.NORMAL} offset={[0.0006, 0.0006]} />
      <Vignette ref={vignetteRef} eskil={false} offset={0.3} darkness={0.25} />
      <Noise ref={noiseRef} premultiply blendFunction={BlendFunction.OVERLAY} />
    </EffectComposer>
  )
}
```

- [ ] **Step 2: Montar `PostFX` en `IcebergCanvas.tsx`** — dentro del `<Suspense>`, **después** de `SceneContent` (el composer debe envolver la escena ya renderizada):

```tsx
import PostFX from './PostFX'
// ... dentro de <Suspense>, tras <SceneContent .../>:
        <PostFX />
```
Nota: `PostFX` debe ser hijo del `<Canvas>` (usa `useThree`/`useFrame`), igual que `SceneContent`.

- [ ] **Step 3: Verificación visual** — `/es/iceberg`: el iceberg tiene foco nítido y el fondo/partículas se desenfocan (DOF); al hacer hover en un dot, el foco se desplaza hacia él; al descender aumentan grano, viñeta y aberración cromática. Si el DOF enfoca mal, ajustar el divisor `dist / 50` y `focalLength`/`bokehScale` observando.

- [ ] **Step 4: lint + build** — `npm run build` debe pasar (atención a imports de `postprocessing`). Medir FPS con el `PerfMonitor` (esquina sup. izq. en dev): anotar el valor en desktop.

- [ ] **Step 5: Commit**

```bash
git add src/components/iceberg/PostFX.tsx src/components/iceberg/IcebergCanvas.tsx
git commit -m "feat(iceberg): postprocesado cinematográfico — bloom, DOF con foco en dot, viñeta/grano/CA por profundidad"
```

---

## Task 5: Cámara cinematográfica (CustomEase + dolly/roll + parallax de ratón)

Refina la cámara para que el descenso tenga ritmo orgánico y vida, sin romper el scroll.

**Files:**
- Modify: `src/components/iceberg/useScrollCamera.ts`
- Create: `src/components/iceberg/MouseParallax.tsx`
- Modify: `src/components/iceberg/IcebergCanvas.tsx`

**Interfaces:**
- Consumes: `ICEBERG_LEVELS`, GSAP `CustomEase`.
- Produces: `export default function MouseParallax()`.

- [ ] **Step 1: Easing cinematográfico en `useScrollCamera.ts`** — registrar `CustomEase` e interpolar con la curva en vez de linealmente. Tras los imports:

```ts
import { CustomEase } from 'gsap/CustomEase'
gsap.registerPlugin(ScrollTrigger, CustomEase)
const cinematicSilk = CustomEase.create('cinematicSilk', '0.45,0.05,0.55,0.95')
```
Dentro del `onUpdate`, sustituir el uso de `p` crudo por la versión suavizada:

```ts
        const p = self.progress
        const e = cinematicSilk(p)
        camera.position.y = gsap.utils.interpolate(prevLevel.cameraY, level.cameraY, e)
        camera.position.z = gsap.utils.interpolate(prevLevel.cameraZ, level.cameraZ, e)
        // Roll y dolly sutiles para sensación de cámara en mano
        camera.rotation.z = Math.sin(p * Math.PI) * 0.02
        camera.lookAt(0, camera.position.y - 1.5, 0)
```
(El cálculo de `totalProgress`/`activeLevel` sigue usando `p` lineal — no tocar.)

- [ ] **Step 2: Crear `MouseParallax.tsx`** — offset de cámara amortiguado por la posición del ratón:

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

export default function MouseParallax({ amount = 0.4 }: { amount?: number }) {
  const { camera } = useThree()
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      target.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useFrame(() => {
    current.current.x += (target.current.x - current.current.x) * 0.05
    current.current.y += (target.current.y - current.current.y) * 0.05
    // Offset aditivo: useScrollCamera fija la base cada frame; aquí solo desplazamos.
    camera.position.x = current.current.x * amount
    camera.position.y += -current.current.y * amount * 0.15
  })

  return null
}
```

- [ ] **Step 3: Montar `MouseParallax`** en `IcebergCanvas.tsx` dentro de `SceneContent`, **después** de `useScrollCamera` (para que el offset se aplique sobre la base):

```tsx
import MouseParallax from './MouseParallax'
// dentro de SceneContent return, primero de todo:
      <MouseParallax />
```
Importante: el orden de los `useFrame` importa. `useScrollCamera` corre en un `ScrollTrigger.onUpdate` (fuera de frame), así que el parallax en `useFrame` se aplica encima sin conflicto. Verificar que no haya jitter.

- [ ] **Step 4: Verificación visual** — el descenso entre niveles ya no es mecánico (acelera/desacelera); mover el ratón inclina/desplaza la cámara sutilmente; no hay temblor ni deriva acumulada. Si la cámara "se va", reducir `amount` o clamplear `camera.position.x`.

- [ ] **Step 5: lint + build + Commit**

```bash
git add src/components/iceberg/useScrollCamera.ts src/components/iceberg/MouseParallax.tsx src/components/iceberg/IcebergCanvas.tsx
git commit -m "feat(iceberg): cámara cinematográfica — CustomEase, roll sutil y parallax de ratón amortiguado"
```

---

## Task 6: Dots reactivos + panel "ficha clasificada" + HUD

Mejora los dots (halo shader, escriben su hover/posición al store para el DOF) y añade el panel de info con estética de expediente. Hace el texto del HUD legible sobre fondo claro y oscuro.

**Files:**
- Modify: `src/components/iceberg/OperationDot.tsx`
- Modify: `src/components/iceberg/IcebergMesh.tsx` (hover local → store)
- Create: `src/components/iceberg/ClassifiedPanel.tsx`
- Modify: `src/components/iceberg/IcebergJourney.tsx` (montar el panel)
- Modify: `src/components/iceberg/LevelLabel.tsx` (blend mode)

**Interfaces:**
- Consumes: `useIcebergStore` (`hoveredOperationId`, `setHoveredOperation`, `setHoveredDotPosition`), `IcebergOperation`.
- Produces: `export default function ClassifiedPanel(props:{ operations: IcebergOperation[]; locale: string })`.

- [ ] **Step 1: Halo additive en `OperationDot.tsx`** — añadir un segundo mesh tras el core, con material additive que late. Dentro del `<group position={position}>`, después del `<mesh ref={meshRef}>`:

```tsx
      {/* Halo additive */}
      <mesh scale={2.2}>
        <sphereGeometry args={[0.056, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
```

- [ ] **Step 2: Escribir hover + posición al store** — en `OperationDot.tsx`, en `onPointerEnter`/`onPointerLeave` del core mesh, además de `onHover(...)`, escribir la posición al store para el DOF:

```tsx
        onPointerEnter={(e) => {
          e.stopPropagation()
          onHover(operation.id)
          useIcebergStore.getState().setHoveredDotPosition(position)
        }}
        onPointerLeave={() => {
          onHover(null)
          useIcebergStore.getState().setHoveredDotPosition(null)
        }}
```
Añadir `import { useIcebergStore } from './useIcebergStore'` arriba.

- [ ] **Step 3: Conectar hover global en `IcebergMesh.tsx`** — `handleHover` debe reflejar en el store para que el panel reaccione:

```tsx
  const setHoveredOperation = useIcebergStore((s) => s.setHoveredOperation)
  const handleHover = useCallback((id: string | null) => {
    setHoveredId(id)
    setHoveredOperation(id)
    document.body.style.cursor = id ? 'pointer' : 'default'
  }, [setHoveredOperation])
```

- [ ] **Step 4: Crear `ClassifiedPanel.tsx`** — overlay 2D estilo dossier que muestra la operación con hover (lee del store), reutilizando la lógica de transición del `SidePanel` de `IcebergScene.tsx`:

```tsx
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
```

- [ ] **Step 5: Montar el panel en `IcebergJourney.tsx`** — dentro del sticky viewport, junto a `<LevelLabel />`:

```tsx
import ClassifiedPanel from './ClassifiedPanel'
// ...
        <ClassifiedPanel operations={operations} locale={locale} />
```

- [ ] **Step 6: HUD legible en `LevelLabel.tsx`** — al `<div>` raíz (línea 25) añadir `style={{ mixBlendMode: 'difference' }}` para que el texto se invierta sobre fondo claro/oscuro. Verificar que sigue legible en los 5 niveles.

- [ ] **Step 7: Verificación visual** — los dots tienen halo y laten; al hover crecen, el DOF enfoca el dot y aparece el panel "ficha clasificada"; el nombre del nivel se lee bien en superficie (sobre claro) y en el abismo (sobre negro). Clic en un dot navega al catálogo.

- [ ] **Step 8: lint + build + Commit**

```bash
git add src/components/iceberg/OperationDot.tsx src/components/iceberg/IcebergMesh.tsx src/components/iceberg/ClassifiedPanel.tsx src/components/iceberg/IcebergJourney.tsx src/components/iceberg/LevelLabel.tsx
git commit -m "feat(iceberg): dots con halo reactivo al DOF, panel ficha clasificada y HUD con blend mode"
```

---

## Task 7: Rendimiento adaptativo + ruta móvil + pulido

Garantiza FPS aceptables degradando con gracia. `PerformanceMonitor` baja calidad si el FPS cae; en móvil se activa `lowPower` (sin DOF, material/partículas baratos).

**Files:**
- Modify: `src/components/iceberg/IcebergCanvas.tsx`

**Interfaces:**
- Consumes: `PerformanceMonitor` (drei); las props `lowPower` de `ProceduralIceberg`, `DriftParticles`, `PostFX`.
- Produces: nada nuevo (cableado interno).

- [ ] **Step 1: Detección de gama baja + DPR adaptativo** — en `IcebergCanvas.tsx`, envolver con estado de `lowPower` y `PerformanceMonitor`:

```tsx
import { useState } from 'react'
import { PerformanceMonitor } from '@react-three/drei'
// ...
export default function IcebergCanvas(props: IcebergCanvasProps) {
  const [dpr, setDpr] = useState(1.5)
  const lowPower = typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

  return (
    <Canvas
      camera={{ position: [0, 4, 12], fov: 50 }}
      gl={{ antialias: !lowPower, alpha: false, powerPreference: 'high-performance' }}
      dpr={lowPower ? 1 : dpr}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
      <Suspense fallback={null}>
        <SceneContent {...props} lowPower={lowPower} />
        <PostFX lowPower={lowPower} />
      </Suspense>
    </Canvas>
  )
}
```
Propagar `lowPower` por `SceneContent` a `ProceduralIceberg` y `DriftParticles` (añadir el prop a la firma de `SceneContent` y pasarlo).

- [ ] **Step 2: Verificación móvil** — emular un dispositivo móvil (DevTools device toolbar o `npm run dev` accedido desde el móvil): debe cargar, el iceberg se ve (material barato), sin DOF, menos partículas, y el scroll desciende. Anotar FPS (objetivo ≥ 30).

- [ ] **Step 3: Verificación desktop** — confirmar FPS ≥ 50 en el `PerfMonitor`; si no, bajar `samples`/`resolution` del `MeshTransmissionMaterial` o `multisampling` del composer.

- [ ] **Step 4: lint + build final** — `npm run lint` y `npm run build` en verde.

- [ ] **Step 5: Commit**

```bash
git add src/components/iceberg/IcebergCanvas.tsx
git commit -m "perf(iceberg): PerformanceMonitor + DPR adaptativo + ruta lowPower para móvil"
```

---

## Limpieza final (tras validar todo)

- [ ] Si la Task 2 (procedural) pasó el gate y ya no se usa el GLB en ninguna ruta: `git rm public/iceberg-long.glb` y commit `chore: eliminar GLB de 74MB no usado`. **Verificar antes** con `grep -rn "iceberg-long" src/` que no queda ninguna referencia (incluida la escena orbital `IcebergScene`/home).

---

## Self-Review (rellenado por el autor del plan)

**1. Spec coverage:**
- §3.1 geometría procedural → Task 1 ✓
- §3.2 shader de hielo + fresnel + profundidad → Task 2 ✓
- §3.3 atmósfera (niebla, background, partículas, god rays) → Task 0 (tabla) + Task 3 ✓
- §3.4 postprocesado (bloom, DOF, viñeta, grano, CA) → Task 4 ✓
- §3.5 cámara (CustomEase, dolly/roll, parallax) → Task 5 ✓
- §3.6 dots + panel + HUD blend → Task 6 ✓
- §4 rendimiento (PerformanceMonitor, lowPower, móvil) → Task 7 ✓
- §5 riesgo + fallback GLB → Task 2 gate + Task 2b ✓
- §0 eliminar GLB 74MB → Task 1 (desreferenciar) + Limpieza final (borrar) ✓

**2. Placeholder scan:** Los pasos de "afinado visual" (Task 2 step 2, Task 4 step 3) no son placeholders: el código base es funcional y compila; el afinado es ajuste de uniforms observando el render, propio de trabajo de shaders. Sin "TBD"/"TODO".

**3. Type consistency:** `sampleLevels(progress, out?)` y `InterpolatedLevel` definidos en Task 0 y consumidos con la misma firma en Tasks 2/3/4. `setHoveredDotPosition` definido en Task 0, escrito en Task 6, leído en Task 4. `lowPower` consistente en `ProceduralIceberg`/`DriftParticles`/`PostFX`/`SceneContent`. `ClassifiedPanel(props)` firma coherente entre Task 6 step 4 y step 5.
