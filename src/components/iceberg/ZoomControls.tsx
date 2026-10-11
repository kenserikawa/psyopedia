"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { ZOOM_MAX, ZOOM_MIN, useIcebergStore } from "./useIcebergStore";

/**
 * Acercar y alejar la cámara. Vive bajo la barra de etapas y comparte con ella
 * el cambio de color con la profundidad: arriba el fondo es claro y abajo casi
 * negro, así que el contraste tiene que invertirse por el camino.
 */
export default function ZoomControls({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const t = useTranslations("iceberg.zoom");
  const zoomIn = useIcebergStore((s) => s.zoomIn);
  const zoomOut = useIcebergStore((s) => s.zoomOut);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inRef = useRef<HTMLButtonElement>(null);
  const outRef = useRef<HTMLButtonElement>(null);

  // Fuera del ciclo de render, como el resto del indicador: se actualiza en
  // cada frame de scroll y no merece un re-render.
  useEffect(() => {
    const apply = (state: { activeLevel: number; zoom: number }) => {
      const shallow = state.activeLevel <= 2;
      const stroke = shallow ? "#1a3a5c" : "#c8dcee";
      const border = shallow ? "rgba(10,22,40,0.25)" : "rgba(255,255,255,0.25)";
      const background = shallow ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.08)";

      if (wrapRef.current) wrapRef.current.style.color = stroke;
      for (const [ref, disabled] of [
        [inRef, state.zoom <= ZOOM_MIN],
        [outRef, state.zoom >= ZOOM_MAX],
      ] as const) {
        const el = ref.current;
        if (!el) continue;
        el.style.borderColor = border;
        el.style.background = background;
        el.style.opacity = disabled ? "0.35" : "1";
        el.disabled = disabled;
      }
    };

    apply(useIcebergStore.getState());
    return useIcebergStore.subscribe(apply);
  }, []);

  const buttonClass =
    "flex h-7 w-7 items-center justify-center rounded-full border backdrop-blur-sm cursor-pointer pointer-events-auto transition-opacity duration-300 disabled:cursor-default motion-reduce:transition-none";

  return (
    <div
      ref={wrapRef}
      className="mt-4 flex flex-col items-center gap-1.5"
      style={{ color: "#1a3a5c" }}
    >
      <button
        ref={inRef}
        type="button"
        onClick={zoomIn}
        aria-label={t("in")}
        className={buttonClass}
        style={{ transition: reducedMotion ? "none" : undefined }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      <button
        ref={outRef}
        type="button"
        onClick={zoomOut}
        aria-label={t("out")}
        className={buttonClass}
        style={{ transition: reducedMotion ? "none" : undefined }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M5 12h14" />
        </svg>
      </button>
    </div>
  );
}
