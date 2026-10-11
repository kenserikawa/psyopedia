// `cameraElevation` son grados por encima del objetivo y `cameraZ` la distancia
// hasta él. El viaje arranca mirando la superficie desde arriba y se va
// tumbando hasta un descenso casi paralelo en las profundidades.
//
// El tope del arranque es el medio ángulo vertical (25°): por encima, el borde
// superior del plano cae por debajo de la horizontal y el horizonte —y con él
// la lámina de agua— desaparece de la toma.
export const ICEBERG_LEVELS = [
  {
    level: 1,
    name: "Surface",
    subtitle: "Well-Known & Declassified",
    cameraElevation: 22,
    cameraZ: 12,
    fogDensity: 0.014,
    ambientIntensity: 0.92,
    accentColor: "#c9e2f2",
    labelColor: "#0a1628",      // dark on pale-blue bg
    subtitleColor: "#1a3a5c",
    bgColor: "#b6d5e8", iceColor: "#e4f4ff", iceRoughness: 0.05, iceThickness: 1.2,
    grain: 0.02, chromaticAberration: 0.0006, vignette: 0.32, godRayIntensity: 0.4, particleDensity: 0.15,
  },
  {
    level: 2,
    name: "Shallow",
    subtitle: "Known but Underappreciated",
    cameraElevation: 12,
    cameraZ: 11,
    fogDensity: 0.032,
    ambientIntensity: 0.5,
    accentColor: "#3f7ea6",
    labelColor: "#eaf6ff",      // light on submerged blue
    subtitleColor: "#b4d8ee",
    bgColor: "#3d7fa6", iceColor: "#9ed3ee", iceRoughness: 0.12, iceThickness: 1.6,
    grain: 0.03, chromaticAberration: 0.0010, vignette: 0.42, godRayIntensity: 0.45, particleDensity: 0.4,
  },
  {
    level: 3,
    name: "Midwater",
    subtitle: "Leaked & Partially Verified",
    cameraElevation: 9,
    cameraZ: 10,
    fogDensity: 0.035,
    ambientIntensity: 0.5,
    accentColor: "#2e86ab",
    labelColor: "#c0e4ff",      // transitioning to light
    subtitleColor: "#90c0e0",
    bgColor: "#2e6f97", iceColor: "#6fb2d6", iceRoughness: 0.22, iceThickness: 2.2,
    grain: 0.05, chromaticAberration: 0.0016, vignette: 0.5, godRayIntensity: 0.25, particleDensity: 0.7,
  },
  {
    level: 4,
    name: "Deep",
    subtitle: "Alleged & Unconfirmed",
    cameraElevation: 8,
    cameraZ: 9,
    fogDensity: 0.06,
    ambientIntensity: 0.25,
    accentColor: "#1a3a5c",
    labelColor: "#d0e8ff",      // light on dark bg
    subtitleColor: "#8ab0d0",
    bgColor: "#11314f", iceColor: "#3f6f93", iceRoughness: 0.35, iceThickness: 3.0,
    grain: 0.075, chromaticAberration: 0.0024, vignette: 0.7, godRayIntensity: 0.08, particleDensity: 0.9,
  },
  {
    level: 5,
    name: "Abyss",
    subtitle: "Deep Conspiracy",
    cameraElevation: 8,
    cameraZ: 8,
    fogDensity: 0.12,
    ambientIntensity: 0.08,
    accentColor: "#060d1a",
    labelColor: "#e8f0ff",      // near-white on dark-blue bg
    subtitleColor: "#90a8c8",
    bgColor: "#040910", iceColor: "#1c3a55", iceRoughness: 0.5, iceThickness: 4.0,
    grain: 0.11, chromaticAberration: 0.0034, vignette: 0.9, godRayIntensity: 0.0, particleDensity: 1.0,
  },
] as const;
