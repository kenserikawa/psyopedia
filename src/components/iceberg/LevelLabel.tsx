"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ICEBERG_LEVELS } from "./constants";
import { useIcebergStore } from "./useIcebergStore";

export default function LevelLabel() {
  const activeLevel = useIcebergStore((s) => s.activeLevel);
  const levelData = ICEBERG_LEVELS.find((l) => l.level === activeLevel);

  if (!levelData) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-end pb-20 pl-8 md:pb-24 md:pl-12">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeLevel}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <p
            className="text-[10px] md:text-xs font-mono tracking-[0.3em] uppercase mb-1"
            style={{ color: levelData.subtitleColor }}
          >
            Level {activeLevel} / 5
          </p>

          <h2
            className="text-3xl md:text-6xl font-bold tracking-tight leading-none mb-2"
            style={{ color: levelData.labelColor }}
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
