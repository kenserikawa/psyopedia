"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { ICEBERG_LEVELS } from "./constants";
import { useIcebergStore } from "./useIcebergStore";
import ZoomControls from "./ZoomControls";

interface ScrollDepthIndicatorProps {
  reducedMotion?: boolean;
  /** Salta al nivel indicado. La barra deja de ser decorativa. */
  onSelectLevel?: (level: number) => void;
}

export default function ScrollDepthIndicator({ reducedMotion = false, onSelectLevel }: ScrollDepthIndicatorProps) {
  const t = useTranslations("iceberg");
  const fillRef = useRef<HTMLDivElement>(null);
  const depthRef = useRef<HTMLSpanElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Subscribe outside React render cycle — no re-renders
  useEffect(() => {
    return useIcebergStore.subscribe((state) => {
      const { scrollProgress, activeLevel } = state;

      if (fillRef.current) {
        fillRef.current.style.height = `${scrollProgress * 100}%`;
        fillRef.current.style.backgroundColor = activeLevel <= 2 ? "#1a3a5c" : "#90c0e0";
      }
      if (trackRef.current) {
        trackRef.current.style.backgroundColor = activeLevel <= 2 ? "rgba(10,22,40,0.15)" : "rgba(255,255,255,0.15)";
      }
      if (depthRef.current) {
        depthRef.current.textContent = `DEPTH ${Math.round(scrollProgress * 100)}%`;
        depthRef.current.style.color = activeLevel <= 2 ? "#1a3a5c" : "#90a8c8";
      }

      dotRefs.current.forEach((dot, i) => {
        if (!dot) return;
        const level = ICEBERG_LEVELS[i];
        dot.style.backgroundColor =
          activeLevel >= level.level
            ? level.labelColor
            : activeLevel <= 2
              ? "rgba(10,22,40,0.15)"
              : "rgba(255,255,255,0.15)";
        dot.style.boxShadow =
          activeLevel === level.level ? `0 0 8px ${level.labelColor}` : "none";

        const button = buttonRefs.current[i];
        if (button) button.setAttribute("aria-current", activeLevel === level.level ? "true" : "false");
      });
    });
  }, []);

  return (
    <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-none">
      <div ref={trackRef} className="w-px h-36 md:h-48 relative" style={{ backgroundColor: "rgba(10,22,40,0.15)" }}>
        <div ref={fillRef} className="w-px absolute top-0" style={{ height: "0%", backgroundColor: "#1a3a5c" }} />
      </div>

      {/* Cada marca salta a su nivel. El botón es mayor que el punto para que
          sea alcanzable con el dedo sin engordar la marca visual. */}
      <div className="flex flex-col items-center">
        {ICEBERG_LEVELS.map((level, i) => (
          <button
            key={level.level}
            ref={(el) => { buttonRefs.current[i] = el; }}
            type="button"
            onClick={() => onSelectLevel?.(level.level)}
            aria-label={t("goToLevel", { level: level.level })}
            className="pointer-events-auto flex h-5 w-5 cursor-pointer items-center justify-center"
          >
            <div
              ref={(el) => { dotRefs.current[i] = el; }}
              className="h-1.5 w-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none"
            />
          </button>
        ))}
      </div>

      <span
        ref={depthRef}
        className="text-[9px] font-mono rotate-90 mt-3 whitespace-nowrap transition-colors duration-500 motion-reduce:transition-none"
        style={{ color: "#1a3a5c" }}
      >
        DEPTH 0%
      </span>

      <ZoomControls reducedMotion={reducedMotion} />
    </div>
  );
}
