import { create } from "zustand";

/** El plano general es el tope de alejamiento; el acercamiento llega a un 25%. */
export const ZOOM_MAX = 1;
export const ZOOM_MIN = 0.75;
export const ZOOM_STEP = 0.05;

const clampZoom = (value: number) =>
  Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number(value.toFixed(4))));

interface IcebergStore {
  activeLevel: number;
  scrollProgress: number; // 0.0 (surface) → 1.0 (abyss)
  /** Altura a la que mira la cámara. La publica useScrollCamera porque ya no se
   *  deduce de la posición: con la vista cenital del arranque, el objetivo está
   *  muy por debajo. El enfoque del DOF la necesita. */
  cameraTargetY: number;
  /** Acercamiento manual, como factor sobre la distancia de cámara calculada.
   *  1 es el plano general (el retranqueo que resuelve el encuadre) y ZOOM_MIN
   *  el máximo acercamiento. */
  zoom: number;
  hoveredOperationId: string | null;
  /** Selección explícita, para dispositivos sin hover: el primer toque marca el
   *  punto y muestra su expediente, el segundo abre la operación. */
  selectedOperationId: string | null;
  hoveredDotPosition: [number, number, number] | null;
  setActiveLevel: (level: number) => void;
  setScrollProgress: (progress: number) => void;
  setCameraTargetY: (y: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setHoveredOperation: (id: string | null) => void;
  setSelectedOperation: (id: string | null) => void;
  setHoveredDotPosition: (pos: [number, number, number] | null) => void;
}

export const useIcebergStore = create<IcebergStore>((set, get) => ({
  activeLevel: 1,
  scrollProgress: 0,
  cameraTargetY: 0,
  zoom: ZOOM_MAX,
  hoveredOperationId: null,
  selectedOperationId: null,
  hoveredDotPosition: null,
  setActiveLevel: (level) => {
    if (get().activeLevel !== level) set({ activeLevel: level });
  },
  setScrollProgress: (progress) => {
    // Only update state (trigger re-renders) when progress changes meaningfully
    // Components that need fine-grained progress should use subscribe or getState()
    if (Math.abs(get().scrollProgress - progress) > 0.005) set({ scrollProgress: progress });
  },
  // Se escribe en cada frame de scroll: solo se propaga si cambia de verdad.
  setCameraTargetY: (y) => {
    if (Math.abs(get().cameraTargetY - y) > 0.01) set({ cameraTargetY: y });
  },
  // Acercar reduce la distancia de cámara, de ahí que el paso vaya en negativo.
  zoomIn: () => set({ zoom: clampZoom(get().zoom - ZOOM_STEP) }),
  zoomOut: () => set({ zoom: clampZoom(get().zoom + ZOOM_STEP) }),
  setHoveredOperation: (id) => set({ hoveredOperationId: id }),
  setSelectedOperation: (id) => set({ selectedOperationId: id }),
  setHoveredDotPosition: (pos) => set({ hoveredDotPosition: pos }),
}));
