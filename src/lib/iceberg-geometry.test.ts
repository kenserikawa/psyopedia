import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";

import {
  ICEBERG_CAMERA_FOV,
  ICEBERG_ORIGIN_Y,
  ICEBERG_SCALE,
  LEVEL_MAX_RADIUS,
  LEVEL_Y_RANGE,
  SEA_LEVEL_Y,
  buildIcebergGeometry,
  buildSilhouette,
  cameraPosition,
  cameraTargetY,
  clearanceRadiusAt,
  computeDotPositions,
  icebergZoomOut,
  levelContentTop,
  labelFacingFade,
  levelFocus,
  seededRandom,
  silhouetteRadiusAt,
} from "./iceberg-geometry";
import { ICEBERG_LEVELS } from "../components/iceberg/constants";

const LEVELS = [1, 2, 3, 4, 5];

function sampleOperations(perLevel: number) {
  return LEVELS.flatMap((icebergLevel) =>
    Array.from({ length: perLevel }, (_, i) => ({
      slug: `operation-${icebergLevel}-${i}-${i * 7 + icebergLevel}`,
      icebergLevel,
    }))
  );
}

/**
 * Paridad de intersecciones: un punto dentro de una malla cerrada cruza la
 * superficie un número impar de veces al salir en cualquier dirección.
 */
function isInsideMesh(mesh: THREE.Mesh, point: THREE.Vector3): boolean {
  const raycaster = new THREE.Raycaster();
  const directions = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0.37, 0.21, -0.9).normalize(),
    new THREE.Vector3(-0.6, -0.5, 0.62).normalize(),
  ];
  let insideVotes = 0;
  for (const dir of directions) {
    raycaster.set(point, dir);
    raycaster.far = Infinity;
    if (raycaster.intersectObject(mesh, false).length % 2 === 1) insideVotes++;
  }
  return insideVotes >= 2;
}

function makeMesh(lowPower: boolean) {
  const geometry = buildIcebergGeometry(lowPower);
  const mesh = new THREE.Mesh(
    geometry,
    // DoubleSide: la paridad necesita contar también las caras traseras.
    new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
  );
  mesh.position.set(0, ICEBERG_ORIGIN_Y, 0);
  mesh.scale.setScalar(ICEBERG_SCALE);
  mesh.updateMatrixWorld(true);
  return { geometry, mesh };
}

test("seededRandom es determinista por slug", () => {
  const a = seededRandom("operation-mockingbird");
  const b = seededRandom("operation-mockingbird");
  const c = seededRandom("operation-paperclip");
  const first = [a(), a(), a()];
  assert.deepEqual(first, [b(), b(), b()]);
  assert.notDeepEqual(first, [c(), c(), c()]);
});

test("la silueta cubre toda la altura del hielo y se anula fuera de ella", () => {
  const { geometry } = makeMesh(true);
  const sil = buildSilhouette(geometry);

  assert.ok(sil.maxY > 0, "el pico debe asomar por encima del agua");
  assert.ok(sil.minY < -13, "la masa sumergida debe pasar del nivel más profundo");
  assert.equal(silhouetteRadiusAt(sil, sil.maxY + 1), 0);
  assert.equal(silhouetteRadiusAt(sil, sil.minY - 1), 0);

  // El radio máximo está cerca de la línea de flotación, no en el fondo.
  const atWaterline = silhouetteRadiusAt(sil, ICEBERG_ORIGIN_Y);
  const atDepth = silhouetteRadiusAt(sil, -10);
  assert.ok(
    atWaterline > atDepth,
    `la silueta debe afilarse con la profundidad (${atWaterline} vs ${atDepth})`
  );

  geometry.dispose();
});

test("ningún punto de operación queda dentro del volumen del hielo", () => {
  // El FBM usa ruido nuevo en cada construcción: se repite para cubrir formas distintas.
  for (let run = 0; run < 4; run++) {
    const { geometry, mesh } = makeMesh(true);
    const sil = buildSilhouette(geometry);
    const placed = computeDotPositions(sampleOperations(12), sil);

    assert.equal(placed.length, 60);

    for (const { op, position } of placed) {
      const [x, y, z] = position;
      const radius = Math.hypot(x, z);
      const ice = silhouetteRadiusAt(sil, y);

      assert.ok(
        radius > ice,
        `run ${run}: ${op.slug} orbita a ${radius.toFixed(2)} con hielo de radio ${ice.toFixed(2)} a y=${y.toFixed(2)}`
      );
      assert.ok(
        !isInsideMesh(mesh, new THREE.Vector3(x, y, z)),
        `run ${run}: ${op.slug} cae dentro de la malla en ${position.map((n) => n.toFixed(2)).join(", ")}`
      );
    }

    geometry.dispose();
  }
});

test("la geometría de alta resolución mantiene la invariante", () => {
  const { geometry, mesh } = makeMesh(false);
  const sil = buildSilhouette(geometry);

  for (const { op, position } of computeDotPositions(sampleOperations(4), sil)) {
    assert.ok(
      !isInsideMesh(mesh, new THREE.Vector3(...position)),
      `${op.slug} cae dentro de la malla de alto detalle`
    );
  }

  geometry.dispose();
});

test("la órbita no supera la cota que usa el encuadre", () => {
  // Varias formas: el relieve es aleatorio y la cota debe cubrir el peor caso.
  for (let run = 0; run < 8; run++) {
    const { geometry } = makeMesh(true);
    const sil = buildSilhouette(geometry);

    for (const { op, position } of computeDotPositions(sampleOperations(20), sil)) {
      const radius = Math.hypot(position[0], position[2]);
      assert.ok(
        radius <= LEVEL_MAX_RADIUS[op.icebergLevel],
        `${op.slug} orbita a ${radius.toFixed(2)}, por encima de la cota ${LEVEL_MAX_RADIUS[op.icebergLevel]} del nivel ${op.icebergLevel}`
      );
      const range = LEVEL_Y_RANGE[op.icebergLevel];
      assert.ok(position[1] >= range.min && position[1] <= range.max);
    }

    geometry.dispose();
  }
});

/** Proyecta un punto del mundo a fracciones de pantalla (0,0 arriba a la izquierda). */
function project(
  point: THREE.Vector3,
  camera: { y: number; z: number },
  targetY: number,
  aspect: number
): { x: number; y: number } {
  const position = new THREE.Vector3(0, camera.y, camera.z);
  const forward = new THREE.Vector3(0, targetY - camera.y, -camera.z).normalize();
  const right = new THREE.Vector3(1, 0, 0);
  const up = new THREE.Vector3().crossVectors(right, forward);

  const d = point.clone().sub(position);
  const depth = d.dot(forward);
  const tan = Math.tan(((ICEBERG_CAMERA_FOV / 2) * Math.PI) / 180);

  return {
    x: (d.dot(right) / depth / (tan * aspect) + 1) / 2,
    y: (1 - d.dot(up) / depth / tan) / 2,
  };
}

test("la órbita entera entra en plano en cualquier proporción y elevación", () => {
  // Desde ultrapanorámico hasta móvil en vertical.
  const aspects = [2.4, 1.78, 1.6, 1.33, 1, 0.75, 0.6, 0.45];

  for (const aspect of aspects) {
    const zoomOut = icebergZoomOut(aspect, ICEBERG_LEVELS);
    assert.ok(zoomOut >= 1, "el retranqueo nunca acerca la cámara");

    for (const level of ICEBERG_LEVELS) {
      const distance = level.cameraZ * zoomOut;
      const targetY = cameraTargetY(
        levelContentTop(level.level),
        distance,
        level.cameraElevation
      );
      const camera = cameraPosition(targetY, distance, level.cameraElevation);
      const { min, max } = LEVEL_Y_RANGE[level.level];
      const radius = LEVEL_MAX_RADIUS[level.level];

      // El punto más alto sobre el eje marca el aire superior del encuadre.
      const anchor = project(new THREE.Vector3(0, max, 0), camera, targetY, aspect);
      assert.ok(
        anchor.y > 0.1 && anchor.y < 0.32,
        `aspect ${aspect}, nivel ${level.level}: el primer punto cae al ${(anchor.y * 100).toFixed(0)}% del alto`
      );

      // Y toda la órbita —que con cámara inclinada se abre en vertical— cabe.
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        for (const y of [min, max]) {
          const p = project(
            new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius),
            camera,
            targetY,
            aspect
          );
          assert.ok(
            p.x > 0 && p.x < 1 && p.y > 0 && p.y < 1,
            `aspect ${aspect}, nivel ${level.level}, ángulo ${i}: punto fuera de plano (${(p.x * 100).toFixed(0)}%, ${(p.y * 100).toFixed(0)}%)`
          );
        }
      }
    }
  }
});

test("el arranque mira desde arriba y el descenso se va tumbando", () => {
  const [surface, ...rest] = ICEBERG_LEVELS;

  assert.ok(
    surface.cameraElevation >= 18,
    "el viaje empieza mirando la superficie desde arriba"
  );
  assert.ok(
    surface.cameraElevation < ICEBERG_CAMERA_FOV / 2,
    "por encima del medio ángulo vertical, el horizonte se sale del plano"
  );
  for (const level of rest) {
    assert.ok(
      level.cameraElevation < surface.cameraElevation,
      `el nivel ${level.level} debe ir más tumbado que la superficie`
    );
  }

  // La elevación no puede repuntar al bajar: el descenso se endereza, no ondula.
  for (let i = 1; i < ICEBERG_LEVELS.length; i++) {
    assert.ok(
      ICEBERG_LEVELS[i].cameraElevation <= ICEBERG_LEVELS[i - 1].cameraElevation,
      `la elevación sube del nivel ${i} al ${i + 1}`
    );
  }

  // En el arranque se mira la superficie desde el aire: la cámara queda sobre
  // la lámina de agua, y lo sigue estando aunque el retranqueo la aleje.
  for (const zoom of [1, 2, 4]) {
    const distance = surface.cameraZ * zoom;
    const targetY = cameraTargetY(levelContentTop(1), distance, surface.cameraElevation);
    const camera = cameraPosition(targetY, distance, surface.cameraElevation);

    assert.ok(
      camera.y > SEA_LEVEL_Y,
      `zoom ${zoom}: la cámara de superficie debe estar sobre el agua (${camera.y.toFixed(1)})`
    );
    assert.ok(
      camera.y > targetY,
      `zoom ${zoom}: la cámara debe mirar hacia abajo`
    );
  }
});

test("el enfoque por nivel se funde en cruz al pasar de uno a otro", () => {
  const segments = ICEBERG_LEVELS.length - 1;
  const at = (progress: number, level: number) => levelFocus(progress, level, segments);

  // Centrado en su propio nivel: enfoque pleno.
  for (const { level } of ICEBERG_LEVELS) {
    assert.equal(at((level - 1) / segments, level), 1);
  }

  // Centrado en un nivel, el contiguo está apagado del todo: las etiquetas
  // desaparecen, no se quedan difuminadas.
  assert.equal(at(0.25, 3), 0);
  assert.equal(at(0.25, 1), 0);
  assert.equal(at(0.5, 2), 0);

  // A mitad de camino los dos niveles comparten el mismo enfoque parcial.
  const mid = 0.375; // entre el nivel 2 (0.25) y el 3 (0.5)
  assert.ok(at(mid, 2) > 0 && at(mid, 2) < 1);
  assert.ok(Math.abs(at(mid, 2) - at(mid, 3)) < 1e-9, "el cruce debe ser simétrico");

  // Y la curva es monótona al alejarse del nivel.
  let previous = 1;
  for (let d = 0; d <= 1.0001; d += 0.05) {
    const value = at(0.25 + d / segments, 2);
    assert.ok(value <= previous + 1e-9, `el enfoque no puede subir al alejarse (d=${d})`);
    previous = value;
  }
});

test("la entrada de cada nivel se escalona con la profundidad del punto", () => {
  const segments = ICEBERG_LEVELS.length - 1;
  const centro = 0.5; // nivel 3
  const nivel = 3;
  const at = (progress: number, stagger: number) =>
    levelFocus(progress, nivel, segments, stagger);

  // En el centro del nivel no hay escalón: todos los puntos están al máximo.
  assert.equal(at(centro, 0), 1);
  assert.equal(at(centro, 1), 1);

  // Bajando hacia el nivel, los puntos más someros (stagger 0) se encienden
  // antes que los hondos.
  const acercandose = centro - 0.5 / segments;
  assert.ok(
    at(acercandose, 0) > at(acercandose, 1),
    "al aproximarse deben ir por delante los someros"
  );

  // Al dejarlo atrás, se apagan en el mismo orden: los someros primero.
  const alejandose = centro + 0.5 / segments;
  assert.ok(
    at(alejandose, 0) < at(alejandose, 1),
    "al alejarse deben apagarse antes los someros"
  );

  // El escalón no puede invertir la curva: sigue decayendo al alejarse.
  for (const stagger of [0, 0.5, 1]) {
    let previous = 1;
    for (let d = 0; d <= 1.0001; d += 0.05) {
      const value = at(centro + d / segments, stagger);
      assert.ok(value <= previous + 1e-9, `stagger ${stagger}: el enfoque repunta en d=${d}`);
      previous = value;
    }
  }
});

test("la etiqueta se apaga cuando el punto gira al otro lado", () => {
  assert.equal(labelFacingFade(1), 1, "de frente, visible");
  assert.equal(labelFacingFade(-1), 0, "detrás del iceberg, invisible");

  assert.ok(
    labelFacingFade(0) > 0.5,
    "en el costado de la órbita el punto se ve, así que conserva su etiqueta"
  );
  assert.ok(
    labelFacingFade(-0.35) < 0.5,
    "pasado el costado, la etiqueta se va apagando"
  );

  let previous = 0;
  for (let facing = -1; facing <= 1.0001; facing += 0.1) {
    const value = labelFacingFade(facing);
    assert.ok(value >= previous - 1e-9, "la curva debe crecer al mirar de frente");
    previous = value;
  }
});

test("el despeje nunca baja del radio mínimo de cada nivel", () => {
  const { geometry } = makeMesh(true);
  const sil = buildSilhouette(geometry);

  for (const level of LEVELS) {
    const { min, max } = LEVEL_Y_RANGE[level];
    for (let y = min; y <= max; y += 0.25) {
      const clearance = clearanceRadiusAt(sil, y, level);
      assert.ok(
        clearance > silhouetteRadiusAt(sil, y),
        `nivel ${level} a y=${y}: despeje ${clearance} no supera el hielo`
      );
    }
  }

  geometry.dispose();
});
