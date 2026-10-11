import * as THREE from "three";
import { SimplexNoise } from "three/addons/math/SimplexNoise.js";

/**
 * Geometría procedural del iceberg y colocación de los puntos de operación.
 *
 * Vive en `lib` (y no junto a los componentes) porque es matemática pura: se
 * ejecuta en Node dentro de `npm test` para garantizar la invariante crítica —
 * ningún punto puede quedar dentro del volumen del hielo, o deja de ser
 * seleccionable con el ratón.
 */

/** Transformación del grupo que contiene al iceberg en la escena. */
export const ICEBERG_SCALE = 1.1;
export const ICEBERG_ORIGIN_Y = -1;

/**
 * Altura de la lámina de agua. Separa el nivel 1 (Surface, sobre el mar) del
 * resto: cae por encima de la franja del nivel 2 y por debajo de la del 1, de
 * modo que cada punto queda del lado que le corresponde.
 */
export const SEA_LEVEL_Y = 1.5;

/**
 * Franja vertical que ocupa cada nivel.
 *
 * Se reparten por todo el témpano y separándose entre sí: el descenso recorre
 * ~40 unidades en vez de las ~17 de antes, y cada tramo cubre más distancia que
 * el anterior, de modo que la caída se acelera hacia el abismo.
 */
export const LEVEL_Y_RANGE: Record<number, { min: number; max: number }> = {
  1: { min: 3, max: 5 },
  2: { min: -3, max: 0 },
  3: { min: -10.5, max: -6.5 },
  4: { min: -20, max: -15 },
  5: { min: -32, max: -26 },
};

/** Radio mínimo de la órbita por nivel: reparte los puntos aunque el hielo sea estrecho. */
export const LEVEL_MIN_RADIUS: Record<number, number> = {
  1: 2.6,
  2: 2.6,
  3: 2.4,
  4: 2.2,
  5: 2.0,
};

/**
 * Cota superior del radio de órbita por nivel. El relieve del hielo cambia en
 * cada carga, así que el encuadre se calcula sobre el peor caso medido (con
 * holgura) en vez de sobre la forma concreta de esta sesión.
 */
export const LEVEL_MAX_RADIUS: Record<number, number> = {
  1: 6.8,
  2: 8.8,
  3: 7.1,
  4: 5.8,
  5: 4.2,
};

/** FOV vertical de la cámara del viaje (IcebergCanvas). */
export const ICEBERG_CAMERA_FOV = 50;

/** Márgenes de plano libres: el lateral reserva sitio para la etiqueta. */
const FRAME_MARGIN_X = 0.09;
const FRAME_MARGIN_Y = 0.04;

/** Techo del retranqueo: más allá, la escena se queda en un punto. */
const MAX_ZOOM_OUT = 6;

export interface CameraLevel {
  level: number;
  cameraZ: number;
  cameraElevation: number;
}

/** Proyecta un punto del mundo a fracciones de plano (0,0 arriba a la izquierda). */
export function projectToScreen(
  point: { x: number; y: number; z: number },
  camera: { y: number; z: number },
  targetY: number,
  aspect: number
): { x: number; y: number } {
  // Base de la cámara: sin alabeo, el lateral es el eje X y el resto vive en YZ.
  const fy = targetY - camera.y;
  const fz = -camera.z;
  const norm = Math.hypot(fy, fz) || 1;
  const forward = { y: fy / norm, z: fz / norm };
  const up = { y: -forward.z, z: forward.y };

  const dy = point.y - camera.y;
  const dz = point.z - camera.z;
  const depth = dy * forward.y + dz * forward.z;
  if (depth <= 0.001) return { x: 0.5, y: 0.5 };

  const tan = Math.tan(((ICEBERG_CAMERA_FOV / 2) * Math.PI) / 180);
  return {
    x: (point.x / depth / (tan * Math.max(aspect, 0.1)) + 1) / 2,
    y: (1 - (dy * up.y + dz * up.z) / depth / tan) / 2,
  };
}

/** ¿Cabe en plano toda la órbita de un nivel con este retranqueo? */
function orbitFits(level: CameraLevel, aspect: number, zoom: number): boolean {
  const distance = level.cameraZ * zoom;
  const targetY = cameraTargetY(
    levelContentTop(level.level),
    distance,
    level.cameraElevation
  );
  const camera = cameraPosition(targetY, distance, level.cameraElevation);
  const radius = LEVEL_MAX_RADIUS[level.level] ?? 8;
  const band = LEVEL_Y_RANGE[level.level];
  if (!band) return true;

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    for (const y of [band.min, band.max]) {
      const p = projectToScreen({ x, y, z }, camera, targetY, aspect);
      if (
        p.x < FRAME_MARGIN_X ||
        p.x > 1 - FRAME_MARGIN_X ||
        p.y < FRAME_MARGIN_Y ||
        p.y > 1 - FRAME_MARGIN_Y
      ) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Multiplicador de distancia de cámara para que la órbita entre en plano.
 *
 * Se resuelve por bisección sobre la proyección real de la órbita, y no con una
 * fórmula del ajuste horizontal: con la cámara inclinada, los puntos del lado
 * cercano se abren hacia abajo, y en pantallas anchas y bajas es el eje
 * vertical el que manda.
 */
export function icebergZoomOut(
  aspect: number,
  levels: readonly CameraLevel[]
): number {
  let zoom = 1;

  for (const level of levels) {
    if (orbitFits(level, aspect, zoom)) continue;
    if (!orbitFits(level, aspect, MAX_ZOOM_OUT)) {
      zoom = MAX_ZOOM_OUT;
      continue;
    }
    let low = zoom;
    let high = MAX_ZOOM_OUT;
    for (let i = 0; i < 24; i++) {
      const mid = (low + high) / 2;
      if (orbitFits(level, aspect, mid)) high = mid;
      else low = mid;
    }
    zoom = high;
  }

  return zoom;
}

/** Margen sobre la silueta del hielo: multiplicativo (bultos) + fijo (radio del punto y su halo). */
const CLEARANCE_FACTOR = 1.08;
const CLEARANCE_MARGIN = 0.55;

/** Dispersión radial extra, siempre hacia afuera para no comerse el margen. */
const RADIUS_JITTER = 0.22;

// Construye una geometría de iceberg: icosaedro subdividido, desplazado con FBM,
// estirado y afilado hacia abajo para la masa sumergida (regla del iceberg).
export function buildIcebergGeometry(lowPower: boolean): THREE.BufferGeometry {
  const detail = lowPower ? 4 : 6;
  const geo = new THREE.IcosahedronGeometry(2, detail);
  const simplex = new SimplexNoise();
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  // FBM: varias octavas de simplex
  const fbm = (x: number, y: number, z: number) => {
    let amp = 1,
      freq = 0.9,
      sum = 0,
      norm = 0;
    for (let o = 0; o < 4; o++) {
      sum += amp * simplex.noise3d(x * freq, y * freq, z * freq);
      norm += amp;
      amp *= 0.5;
      freq *= 2.1;
    }
    return sum / norm;
  };

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const dir = v.clone().normalize();
    const n = fbm(dir.x, dir.y, dir.z); // -1..1

    // Desplazamiento facetado del relieve
    const r = 2 + n * 0.55;

    // Masa sumergida: estirar e ir afilando por debajo de y=0
    if (dir.y < 0) {
      const d = -dir.y; // 0..1
      v.multiplyScalar(r);
      // Estira hacia abajo (~9x): el descenso recorre todo el témpano, así que
      // la aguja sumergida tiene que seguir ahí cuando llegas al abismo.
      v.y *= 1 + d * 8.0;
      const taper = 1 - d * 0.45; // afila el fondo
      v.x *= taper;
      v.z *= taper;
    } else {
      v.multiplyScalar(r);
      v.y *= 1.1; // pico ligeramente más alto
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }

  // Facetas: sin índice + normales por cara
  const flat = geo.toNonIndexed();
  flat.computeVertexNormals();
  geo.dispose();
  return flat;
}

/**
 * Perfil de la silueta: para cada franja de altura (en coordenadas de mundo),
 * el radio horizontal máximo que alcanza el hielo. El ruido del FBM cambia en
 * cada carga, así que se mide sobre la geometría real en vez de estimarla.
 */
export interface IcebergSilhouette {
  binSize: number;
  minY: number;
  maxY: number;
  /** Radio máximo por franja, indexado desde `minY`. */
  radii: Float32Array;
}

export function buildSilhouette(
  geometry: THREE.BufferGeometry,
  binSize = 0.4
): IcebergSilhouette {
  const pos = geometry.attributes.position;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) * ICEBERG_SCALE + ICEBERG_ORIGIN_Y;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const bins = Math.max(1, Math.ceil((maxY - minY) / binSize) + 1);
  const radii = new Float32Array(bins);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) * ICEBERG_SCALE;
    const z = pos.getZ(i) * ICEBERG_SCALE;
    const y = pos.getY(i) * ICEBERG_SCALE + ICEBERG_ORIGIN_Y;
    const bin = Math.floor((y - minY) / binSize);
    const r = Math.hypot(x, z);
    if (r > radii[bin]) radii[bin] = r;
  }

  // Con el témpano estirado, los anillos de vértices quedan muy separados en
  // vertical y entre ellos hay franjas sin ningún vértice: medidas a cero.
  // Se rellenan con el máximo de los anillos que las encierran, que es una cota
  // superior de la superficie intermedia — nunca subestima el hielo.
  fillGaps(radii);

  return { binSize, minY, maxY, radii };
}

function fillGaps(radii: Float32Array) {
  const forward = new Float32Array(radii.length);
  let last = 0;
  for (let i = 0; i < radii.length; i++) {
    if (radii[i] > 0) last = radii[i];
    forward[i] = last;
  }

  last = 0;
  for (let i = radii.length - 1; i >= 0; i--) {
    if (radii[i] > 0) last = radii[i];
    else radii[i] = Math.max(forward[i], last);
  }
}

/**
 * Radio del hielo a una altura dada. Toma el máximo de las franjas vecinas: una
 * cara inclinada sobresale por encima de su propio vértice, y el punto tiene
 * volumen propio.
 */
export function silhouetteRadiusAt(sil: IcebergSilhouette, y: number): number {
  if (y > sil.maxY || y < sil.minY) return 0;
  const center = Math.floor((y - sil.minY) / sil.binSize);
  let max = 0;
  for (let b = center - 1; b <= center + 1; b++) {
    if (b < 0 || b >= sil.radii.length) continue;
    if (sil.radii[b] > max) max = sil.radii[b];
  }
  return max;
}

/** Radio de órbita mínimo que deja un punto fuera del hielo a esa altura. */
export function clearanceRadiusAt(
  sil: IcebergSilhouette,
  y: number,
  level: number
): number {
  const ice = silhouetteRadiusAt(sil, y);
  return Math.max(
    LEVEL_MIN_RADIUS[level] ?? 2.4,
    ice * CLEARANCE_FACTOR + CLEARANCE_MARGIN
  );
}

/** Aire sobre el punto más alto: su etiqueta va 0.48 por encima y ocupa algo. */
const LABEL_HEADROOM = 1;

/** Parte del alto del plano que se deja libre por encima de esa franja. */
const VERTICAL_HEADROOM = 0.18;

/** Techo del contenido de un nivel: el punto más alto más su etiqueta. */
export function levelContentTop(level: number): number {
  return (LEVEL_Y_RANGE[level]?.max ?? 0) + LABEL_HEADROOM;
}

/**
 * Altura a la que mira la cámara.
 *
 * No es un offset fijo bajo la cámara: se resuelve para que el punto más alto
 * del nivel caiga siempre a `VERTICAL_HEADROOM` del borde superior, con la
 * cámara a `distance` del objetivo y `elevation` grados por encima.
 *
 * Con la cámara sobre el eje, un punto a altura `py` proyecta en
 * `ndcY = cos(e)·Δ / ((D − sen(e)·Δ)·tan(fov/2))`, con `Δ = py − ty`. Despejar
 * Δ da la fórmula de abajo; con elevación 0 se reduce a `py − N·tan·D`.
 *
 * Sin esto, un viewport alto —donde el retranqueo agranda el frustum vertical—
 * deja media pantalla vacía antes del primer punto, y la vista cenital del
 * arranque descuadraría la franja.
 */
export function cameraTargetY(
  contentTop: number,
  distance: number,
  elevationDeg = 0
): number {
  const tan = Math.tan(((ICEBERG_CAMERA_FOV / 2) * Math.PI) / 180);
  const ndc = 1 - 2 * VERTICAL_HEADROOM;
  const elevation = (elevationDeg * Math.PI) / 180;
  const offset =
    (ndc * tan * distance) /
    (Math.cos(elevation) + ndc * tan * Math.sin(elevation));
  return contentTop - offset;
}

/**
 * Posición de la cámara: a `distance` del objetivo y `elevation` grados por
 * encima. Modelarla así —y no con una Y absoluta— hace que el retranqueo
 * responsive aleje la cámara por su propio eje, conservando el ángulo del
 * plano en cualquier proporción de pantalla.
 */
export function cameraPosition(
  targetY: number,
  distance: number,
  elevationDeg: number
): { y: number; z: number } {
  const elevation = (elevationDeg * Math.PI) / 180;
  return {
    y: targetY + distance * Math.sin(elevation),
    z: distance * Math.cos(elevation),
  };
}

/**
 * Enfoque de un nivel según el scroll continuo, no según el nivel activo.
 *
 * `progress` va de 0 (superficie) a 1 (abismo) y `level` es 1..5. Devuelve 1
 * cuando la cámara está centrada en ese nivel y 0 cuando ya está en el
 * siguiente; entre medias, el solape de las dos curvas produce el fundido
 * cruzado entre los puntos que se van y los que llegan.
 *
 * `stagger` (0 arriba de la franja, 1 abajo) escalona la entrada: al bajar
 * hacia un nivel se encienden primero sus puntos más someros y al dejarlo se
 * apagan en el mismo orden, así que la cascada acompaña al descenso en vez de
 * aparecer todo el nivel de golpe. En el centro del nivel todos valen 1.
 */
export function levelFocus(
  progress: number,
  level: number,
  segments: number,
  stagger = 0.5
): number {
  const levelPos = (level - 1) / segments;
  const delta = (progress - levelPos) * segments;

  // El desfase se mide desde el centro de la franja (0.5, neutro): así el
  // escalonado separa los puntos entre sí sin desplazar la curva media, que es
  // la que cruza el fundido con el nivel vecino.
  const offset = delta < 0 ? stagger - 0.5 : 0.5 - stagger;
  const focusOut = FOCUS_OUT - STAGGER_SPREAD * offset;

  return 1 - smoothstep(Math.abs(delta), FOCUS_IN, focusOut);
}

/** Enfocado hasta un cuarto de nivel, apagado del todo a cuatro quintos. */
const FOCUS_IN = 0.25;
const FOCUS_OUT = 0.8;

/** Cuánto se adelanta o retrasa un punto respecto a sus vecinos de franja. */
const STAGGER_SPREAD = 0.35;

/**
 * Visibilidad de la etiqueta según lo orientada que esté al espectador.
 *
 * `facing` es el coseno entre la dirección del punto y la de la cámara: 1 de
 * frente, 0 en el costado de la órbita, -1 al otro lado del iceberg. El costado
 * sigue rotulado —ahí el punto se ve perfectamente— y el apagado se reserva
 * para el hemisferio trasero, que antes se quedaba como un rótulo borroso
 * flotando sobre el hielo.
 */
export function labelFacingFade(facing: number): number {
  return smoothstep(facing, -0.55, 0.05);
}

/** Igual que THREE.MathUtils.smoothstep, sin arrastrar three a este cálculo. */
function smoothstep(x: number, min: number, max: number): number {
  if (x <= min) return 0;
  if (x >= max) return 1;
  const t = (x - min) / (max - min);
  return t * t * (3 - 2 * t);
}

// Deterministic pseudo-random from string — same slug always gives same number
export function seededRandom(str: string): () => number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
    h = (h ^ (h >>> 16)) >>> 0;
    return h / 0x100000000;
  };
}

export interface PlaceableOperation {
  slug: string;
  icebergLevel: number;
}

export interface PlacedOperation<T extends PlaceableOperation> {
  op: T;
  position: [number, number, number];
  /** Sitio del punto dentro de su franja: 0 el más somero, 1 el más hondo. */
  stagger: number;
}

/**
 * Coloca cada operación en una órbita alrededor del iceberg, siempre por fuera
 * de la silueta del hielo a su altura.
 */
export function computeDotPositions<T extends PlaceableOperation>(
  operations: T[],
  silhouette: IcebergSilhouette
): PlacedOperation<T>[] {
  const result: PlacedOperation<T>[] = [];

  for (const op of operations) {
    const range = LEVEL_Y_RANGE[op.icebergLevel];
    if (!range) continue;

    const rand = seededRandom(op.slug);

    // Random Y within level range
    const y = range.min + rand() * (range.max - range.min);

    // Ángulo libre; el radio parte del despeje mínimo y solo crece.
    const angle = rand() * Math.PI * 2;
    const dotRadius =
      clearanceRadiusAt(silhouette, y, op.icebergLevel) *
      (1 + rand() * RADIUS_JITTER);

    result.push({
      op,
      position: [Math.cos(angle) * dotRadius, y, Math.sin(angle) * dotRadius],
      stagger: (range.max - y) / (range.max - range.min),
    });
  }

  return result;
}
