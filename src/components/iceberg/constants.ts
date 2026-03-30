export const ICEBERG_LEVELS = [
  {
    level: 1,
    name: "Surface",
    subtitle: "Well-Known & Declassified",
    cameraY: 4,
    cameraZ: 12,
    fogDensity: 0.008,
    ambientIntensity: 1.0,
    accentColor: "#e0f4ff",
    labelColor: "#0a1628",      // dark on white bg
    subtitleColor: "#1a3a5c",
  },
  {
    level: 2,
    name: "Shallow",
    subtitle: "Known but Underappreciated",
    cameraY: -1,
    cameraZ: 11,
    fogDensity: 0.018,
    ambientIntensity: 0.75,
    accentColor: "#7ec8e3",
    labelColor: "#0e2a4a",      // dark on light-blue bg
    subtitleColor: "#1a4a6a",
  },
  {
    level: 3,
    name: "Midwater",
    subtitle: "Leaked & Partially Verified",
    cameraY: -4,
    cameraZ: 10,
    fogDensity: 0.035,
    ambientIntensity: 0.5,
    accentColor: "#2e86ab",
    labelColor: "#c0e4ff",      // transitioning to light
    subtitleColor: "#90c0e0",
  },
  {
    level: 4,
    name: "Deep",
    subtitle: "Alleged & Unconfirmed",
    cameraY: -7,
    cameraZ: 9,
    fogDensity: 0.06,
    ambientIntensity: 0.25,
    accentColor: "#1a3a5c",
    labelColor: "#d0e8ff",      // light on dark bg
    subtitleColor: "#8ab0d0",
  },
  {
    level: 5,
    name: "Abyss",
    subtitle: "Deep Conspiracy",
    cameraY: -11,
    cameraZ: 8,
    fogDensity: 0.12,
    ambientIntensity: 0.08,
    accentColor: "#060d1a",
    labelColor: "#e8f0ff",      // near-white on dark-blue bg
    subtitleColor: "#90a8c8",
  },
] as const;
