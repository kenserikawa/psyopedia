"use client";

import { ICEBERG_LEVELS } from "./constants";
import { useIcebergStore } from "./useIcebergStore";

export default function ScrollDepthIndicator() {
  const scrollProgress = useIcebergStore((s) => s.scrollProgress);
  const activeLevel = useIcebergStore((s) => s.activeLevel);

  // Track and label colors invert with depth
  const trackBg = activeLevel <= 2 ? "rgba(10,22,40,0.15)" : "rgba(255,255,255,0.15)";
  const trackFill = activeLevel <= 2 ? "#1a3a5c" : "#90c0e0";
  const depthTextColor = activeLevel <= 2 ? "#1a3a5c" : "#90a8c8";

  return (
    <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-none">
      {/* Vertical track */}
      <div className="w-px h-36 md:h-48 relative" style={{ backgroundColor: trackBg }}>
        <div
          className="w-px absolute top-0 transition-all duration-500"
          style={{ height: `${scrollProgress * 100}%`, backgroundColor: trackFill }}
        />
      </div>

      {/* Level dots */}
      <div className="flex flex-col items-center gap-2">
        {ICEBERG_LEVELS.map((level) => (
          <div
            key={level.level}
            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{
              backgroundColor:
                activeLevel >= level.level
                  ? level.labelColor
                  : activeLevel <= 2
                    ? "rgba(10,22,40,0.15)"
                    : "rgba(255,255,255,0.15)",
              boxShadow:
                activeLevel === level.level
                  ? `0 0 8px ${level.labelColor}`
                  : "none",
            }}
          />
        ))}
      </div>

      {/* Depth label */}
      <span
        className="text-[9px] font-mono rotate-90 mt-3 whitespace-nowrap transition-colors duration-500"
        style={{ color: depthTextColor }}
      >
        DEPTH {Math.round(scrollProgress * 100)}%
      </span>
    </div>
  );
}
