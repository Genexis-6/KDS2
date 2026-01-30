

import { create } from "zustand";

type NavigationState = {
  currentPath: string;
  params: Record<string, any>;
  navigate: (path: string, params?: Record<string, any>) => void;
  reset: () => void;
  setNavigateFunction: (fn: (path: string) => void) => void;
  _navigateFn?: (path: string) => void;
};


export const useNavigationStore = create<NavigationState>((set) => ({
  currentPath: "/",
  params: {},
  navigate: (path, params = {}) => {
    set((state) => {
      if (state._navigateFn) state._navigateFn(path);
      return { currentPath: path, params };
    });
  },
  reset: () => set({ currentPath: "/", params: {} }),
  setNavigateFunction: (fn) => set({ _navigateFn: fn }),
}));


