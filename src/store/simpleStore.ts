import { create } from 'zustand';

// Simple store without middleware for now
interface SimpleStore {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useSimpleStore = create<SimpleStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));
