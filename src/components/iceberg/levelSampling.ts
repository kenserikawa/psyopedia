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

// Module-level scratch color — reused across all sampleLevels calls to avoid per-frame heap allocations.
const _tmp = new THREE.Color();

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
  r.fogColor.set(a.accentColor).lerp(_tmp.set(b.accentColor), t);
  r.bgColor.set(a.bgColor).lerp(_tmp.set(b.bgColor), t);
  r.iceColor.set(a.iceColor).lerp(_tmp.set(b.iceColor), t);
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
