import { create } from "zustand";

interface IcebergStore {
  activeLevel: number;
  scrollProgress: number; // 0.0 (surface) → 1.0 (abyss)
  hoveredOperationId: string | null;
  setActiveLevel: (level: number) => void;
  setScrollProgress: (progress: number) => void;
  setHoveredOperation: (id: string | null) => void;
}

export const useIcebergStore = create<IcebergStore>((set) => ({
  activeLevel: 1,
  scrollProgress: 0,
  hoveredOperationId: null,
  setActiveLevel: (level) => set({ activeLevel: level }),
  setScrollProgress: (progress) => set({ scrollProgress: progress }),
  setHoveredOperation: (id) => set({ hoveredOperationId: id }),
}));
