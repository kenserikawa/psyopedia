# Iceberg Journey — "Descenso Clasificado"

**Fecha:** 2026-06-30
**Ruta afectada:** `/[locale]/iceberg`
**Objetivo:** Rediseñar el journey 3D del iceberg para que sea "muy muy aesthetic", con una
dirección estética deliberada de *descenso oceanográfico + tensión de expediente desclasificado*,
manteniendo el rendimiento aceptable en desktop y degradando con gracia en móvil.

---

## 1. Resumen de decisiones (tomadas en brainstorming)

| Decisión | Elección |
|----------|----------|
| Dirección estética | **Descenso clasificado**: cian glacial → azul abismal → negro; atmósfera cada vez más opresiva (grano, viñeta, aberración cromática) al descender; god rays + partículas a la deriva. Ref: NatGeo submarino + "archivo X". |
| Modelo 3D | **Procedural + shader** (reemplaza el GLB de 74 MB por geometría generada). 0 MB de descarga, refracción real, reacciona al scroll. |
| Interacción | **Scroll + micro-interacciones**: scroll conduce el descenso; parallax sutil de ratón; dots que laten/reaccionan al hover; panel de info animado. |

**Problema crítico que motiva el rediseño del modelo:** `public/iceberg-long.glb` pesa **73.9 MB**.
Ningún efecto compensa esa descarga. El enfoque procedural lo elimina por completo.

---

## 2. Arquitectura

### Se mantiene (los huesos del journey funcionan)
- `IcebergJourney.tsx` — contenedor sticky 500vh + Lenis smooth scroll + gradiente.
- `useScrollCamera.ts` — ScrollTrigger por nivel (se refina, no se reemplaza).
- `constants.ts` — los 5 niveles (`ICEBERG_LEVELS`); se **extiende** con parámetros de atmósfera/material.
- `useIcebergStore.ts` — store Zustand (`activeLevel`, `scrollProgress`, `hoveredOperationId`).
- Modelo de datos de operaciones (`IcebergOperation`), `ScrollDepthIndicator`, `LevelLabel`.

### Se reemplaza / añade
| Componente | Acción |
|------------|--------|
| `IcebergMesh.tsx` (GLB) | **Reemplazar** por `ProceduralIceberg.tsx` |
| `IcebergCanvas.tsx` | Añadir `EffectComposer`, `PerformanceMonitor`, capa de atmósfera ampliada |
| `DepthAtmosphere.tsx` | Ampliar: niebla `FogExp2` reactiva + `scene.background` interpolado |
| `OperationDot.tsx` | Mejorar: shader de glow pulsante + foco DOF al hover |
| `useScrollCamera.ts` | Refinar: `CustomEase`, dolly/roll, micro-pausas |
| (nuevo) `MouseParallax.tsx` | Offset de cámara amortiguado por posición del ratón |
| (nuevo) `DriftParticles.tsx` | Plancton/sedimento a la deriva (`Sparkles` o puntos custom) |
| (nuevo) `GodRays.tsx` | Conos de luz volumétrica en superficie |
| (nuevo) `PostFX.tsx` | `EffectComposer` con DOF, Bloom, Vignette, Noise, ChromaticAberration, ToneMapping |
| `IcebergScene.tsx` `SidePanel` | Portar al journey con estilo "ficha clasificada" |

### Flujo de datos
- **Fuente de verdad del progreso:** `useIcebergStore.scrollProgress` (0→1) y `activeLevel` (1→5),
  ya actualizados por `useScrollCamera` vía ScrollTrigger.
- Cada capa visual (atmósfera, material, postFX, dots) **lee** `scrollProgress`/`activeLevel` del store
  e interpola sus parámetros. Una sola fuente, muchas capas suscritas. Sin estado duplicado.
- `hoveredOperationId` (store) → controla glow del dot + objetivo de foco del DOF + panel de info.

---

## 3. Capas del diseño

### 3.1 `ProceduralIceberg` — geometría + displacement
- Base: `IcosahedronGeometry` muy subdividida (detalle 6-8), o forma esculpida.
- **Vertex shader**: simplex noise 3D (FBM, 3-4 octavas) desplaza vértices → facetas y grietas.
  GLSL noise inlineado en el shader (sin dependencia nueva).
- **Regla del iceberg**: masa sumergida ≈ 6-7× la emergida; refuerza la metáfora "visible vs. oculto".
- Look **low-poly facetado** (flat normals) → aspecto cristalino + rendimiento excelente.
- Deriva lentísima animada por `uTime`.

### 3.2 Shader / material de hielo
- Cuerpo: `MeshTransmissionMaterial` (drei) — transmisión, IOR ≈ 1.31, `thickness`, `roughness` baja,
  `chromaticAberration` sutil.
- Capa **fresnel rim** (borde glacial) + *fake subsurface* (iluminado desde arriba, apagado hacia abajo).
- **Interpolado por `scrollProgress`**: arriba claro/translúcido → abajo turbio/oscuro/opaco.
- **Fallback de rendimiento** (móvil / FPS bajo): `MeshPhysicalMaterial` con `transmission` simple.

### 3.3 Atmósfera reactiva a la profundidad
- **Niebla** `FogExp2`: densidad + color interpolados por scroll (cian → azul → negro).
- **`scene.background`** interpolado dentro del canvas (en vez del gradiente CSS) para que niebla/DOF/grain
  se integren con el fondo.
- **God rays** en superficie (`GodRays.tsx`): conos volumétricos desde arriba; se desvanecen al bajar.
- **Partículas a la deriva** (`DriftParticles.tsx`): escasas/rápidas arriba → densas/lentas en el abismo.
- Burbujas ocasionales ascendentes.

### 3.4 Postprocesado (`PostFX.tsx`)
`EffectComposer` gobernado por `scrollProgress`:
- **Bloom** selectivo (god rays + dots).
- **Depth of Field**: foco en iceberg/dot activo, fondo desenfocado.
- **Vignette**: se cierra con la profundidad.
- **Noise** (grano de película): sutil arriba → marcado en el abismo.
- **ChromaticAberration**: creciente hacia abajo (sensación de presión).
- **ToneMapping** ACESFilmic.

### 3.5 Cámara y ritmo (`useScrollCamera` refinado)
- ScrollTrigger + **`CustomEase`** (curvas tipo `cinematicSilk` 0.45,0.05,0.55,0.95).
- Leve **dolly + roll** y **micro-pausas** de "respiro" al llegar a cada nivel (revelan operaciones).
- **Parallax de ratón** (`MouseParallax.tsx`): offset de cámara amortiguado (lerp), no rompe el scroll.

### 3.6 Dots, panel e HUD
- Dots: esferas con shader de **glow pulsante** (color por nivel); al hover crecen, brillan,
  **atraen el foco del DOF** y muestran label.
- Panel de info: portar `SidePanel` con estilo "ficha clasificada" (serif EB Garamond + etiqueta de nivel
  + metadata tipo dossier). Click → navega a `/[locale]/catalog/[slug]` (ya existe).
- Texto 2D con `mix-blend-mode: difference` → legible sobre fondo claro y oscuro.

---

## 4. Rendimiento (presupuesto honesto)

`MeshTransmissionMaterial` + DOF + Bloom + god rays a pantalla completa es **caro**. Estrategia:
- Procedural = **0 MB** de modelo (elimina el mayor cuello de botella actual).
- `PerformanceMonitor` (drei): baja DPR y desactiva efectos si el FPS cae.
- **Móvil**: material físico barato (no transmission), menos partículas, DOF off, menos octavas de noise.
- `gl={{ powerPreference: 'high-performance' }}`, `frameloop` pausado fuera de viewport.
- `PerfMonitor` propio (ya existe en `IcebergCanvas`) mide FPS/draws/tris en dev.
- Tope DPR `[1, 1.5]` (ya configurado), ajustado dinámicamente.

**Objetivo:** ≥ 50 FPS en desktop de gama media; ≥ 30 FPS en móvil con la ruta degradada.

---

## 5. Riesgo principal y mitigación

**Riesgo:** que el shader de hielo procedural se vea genuinamente como hielo (no plástico ni roca)
es lo más difícil del proyecto.

**Mitigación:** el plan ataca eso **primero** (Fases 1-2) para validar el look antes de invertir en
el resto. Si el procedural no convence tras la Fase 2, el fallback es **optimizar el GLB actual**
(`gltf-transform` / `gltfjsx -T`, Draco + KTX2, ~74 MB → 2-5 MB) sin perder las Fases 3-7, que son
independientes del origen de la geometría.

---

## 6. Fases de implementación

| Fase | Entrega | Criterio de éxito |
|------|---------|-------------------|
| 0 | Quitar GLB del bundle; (opcional) `leva` en dev | El bundle ya no incluye `iceberg-long.glb`; journey sigue cargando |
| 1 | `ProceduralIceberg`: geometría + displacement noise | Iceberg facetado visible, con forma creíble, 0 MB de modelo |
| 2 | Shader de hielo: transmisión, fresnel, profundidad | Se lee como hielo translúcido; parámetros cambian con scroll |
| 3 | Atmósfera: niebla reactiva, partículas, god rays | Fondo/niebla interpolan por nivel; partículas y rays presentes |
| 4 | `PostFX`: composer, DOF, grain, vignette, CA, bloom | Postprocesado activo y gobernado por scroll |
| 5 | Cámara cinematográfica: CustomEase, parallax, ritmo | Transiciones con easing orgánico; parallax de ratón; micro-pausas |
| 6 | Dots + panel + HUD tipográfico | Dots reactivos al hover; panel "ficha clasificada"; texto blend |
| 7 | Rendimiento adaptativo + móvil + pulido | `PerformanceMonitor` activo; ruta móvil degradada; FPS objetivo |

Cada fase es un incremento verificable visualmente. Las fases 3-7 no dependen de que la geometría
sea procedural o GLB (desacopladas del riesgo principal).

---

## 7. Testing y verificación

- **Sin framework de tests** en el proyecto (decisión preexistente) → verificación **visual/manual**
  por fase, idealmente con capturas comparativas.
- `PerfMonitor` (FPS/draws/tris) y `PerformanceMonitor` de drei como instrumentación de rendimiento.
- Comprobación móvil real o emulada (DPR, material fallback, FPS ≥ 30).
- `npm run build` y `npm run lint` deben pasar tras cada fase.

---

## 8. Fuera de alcance (YAGNI)

- Theatre.js (ya hay GSAP; añadiría peso sin beneficio claro).
- Audio/sonido del descenso (posible mejora futura, no en este spec).
- Cambios al modelo de datos de operaciones o a otras rutas.
- Rediseño de la escena orbital `IcebergScene` de la home (solo se reutiliza su `SidePanel`).
