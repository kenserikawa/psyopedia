"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ICEBERG_LEVELS } from "./constants";
import { useIcebergStore } from "./useIcebergStore";

// Colores del degradado animado del título, uno por nivel: oscuros sobre el
// cielo del nivel 1 y claros a partir del 2, que ya es agua.
// Se pintan tal cual. Antes iban con mix-blend-mode difference, pero el color
// resultante es |fondo − color| y eso queda acotado por el fondo: con los
// azules medios de los niveles sumergidos el título no podía pasar de un ocre
// apagado, hiciera lo que hiciera el degradado.
const LEVEL_WATER_COLORS: Record<number, [string, string, string]> = {
  1: ["#4a9eca", "#0a1628", "#2e7aa8"],
  2: ["#cfe8f8", "#6fb5da", "#eaf6ff"],
  3: ["#60c0ff", "#2e86ab", "#90d8ff"],
  4: ["#80d0ff", "#3a7aa0", "#b0e4ff"],
  5: ["#a0e0ff", "#4a90b8", "#d0f0ff"],
};

export default function LevelLabel({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const activeLevel = useIcebergStore((s) => s.activeLevel);
  const levelData = ICEBERG_LEVELS.find((l) => l.level === activeLevel);

  if (!levelData) return null;

  const [c1, c2, c3] = LEVEL_WATER_COLORS[activeLevel] ?? ["#4a9eca", "#0a1628", "#2e7aa8"];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-end pb-20 pl-8 md:pb-24 md:pl-12">
      <style>{`
        @keyframes waterText {
          0%   { background-position: 0% 50%; }
          25%  { background-position: 50% 100%; }
          50%  { background-position: 100% 50%; }
          75%  { background-position: 50% 0%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeLevel}
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reducedMotion ? 0 : -20 }}
          transition={{ duration: reducedMotion ? 0 : 0.6, ease: "easeOut" }}
        >
          <p
            className="text-[10px] md:text-xs font-mono tracking-[0.3em] uppercase mb-1"
            style={{ color: levelData.subtitleColor }}
          >
            Level {activeLevel} / 5
          </p>

          <h2
            className="text-3xl md:text-6xl font-bold tracking-tight leading-none mb-2"
            style={{
              // backgroundImage, no el atajo `background`: al repintar, el atajo
              // resetea background-clip y el degradado deja de recortarse al texto.
              backgroundImage: `linear-gradient(130deg, ${c1}, ${c2}, ${c3}, ${c1}, ${c2})`,
              backgroundSize: "300% 300%",
              animation: reducedMotion ? "none" : "waterText 5s ease-in-out infinite",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {levelData.name}
          </h2>

          <p
            className="text-xs md:text-sm font-light tracking-wide"
            style={{ color: levelData.subtitleColor }}
          >
            {levelData.subtitle}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
