import { create } from "zustand";

interface IcebergStore {
  activeLevel: number;
  scrollProgress: number; // 0.0 (surface) → 1.0 (abyss)
  hoveredOperationId: string | null;
  hoveredDotPosition: [number, number, number] | null;
  setActiveLevel: (level: number) => void;
  setScrollProgress: (progress: number) => void;
  setHoveredOperation: (id: string | null) => void;
  setHoveredDotPosition: (pos: [number, number, number] | null) => void;
}

export const useIcebergStore = create<IcebergStore>((set, get) => ({
  activeLevel: 1,
  scrollProgress: 0,
  hoveredOperationId: null,
  hoveredDotPosition: null,
  setActiveLevel: (level) => {
    if (get().activeLevel !== level) set({ activeLevel: level });
  },
  setScrollProgress: (progress) => {
    // Only update state (trigger re-renders) when progress changes meaningfully
    // Components that need fine-grained progress should use subscribe or getState()
    if (Math.abs(get().scrollProgress - progress) > 0.005) set({ scrollProgress: progress });
  },
  setHoveredOperation: (id) => set({ hoveredOperationId: id }),
  setHoveredDotPosition: (pos) => set({ hoveredDotPosition: pos }),
}));
