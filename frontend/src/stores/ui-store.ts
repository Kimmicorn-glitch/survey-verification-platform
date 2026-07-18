import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * UI Store
 * Manages global UI state including sidebar, modals, and theme.
 */

interface UIState {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  activeModal: string | null;
  commandPaletteOpen: boolean;
  theme: 'light' | 'dark' | 'system';

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  toggleCommandPalette: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(
  devtools((set) => ({
    sidebarCollapsed: false,
    sidebarMobileOpen: false,
    activeModal: null,
    commandPaletteOpen: false,
    theme: 'dark',

    toggleSidebar: () =>
      set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

    setSidebarCollapsed: (collapsed) =>
      set({ sidebarCollapsed: collapsed }),

    toggleMobileSidebar: () =>
      set((state) => ({ sidebarMobileOpen: !state.sidebarMobileOpen })),

    setMobileSidebarOpen: (open) =>
      set({ sidebarMobileOpen: open }),

    openModal: (modalId) =>
      set({ activeModal: modalId }),

    closeModal: () =>
      set({ activeModal: null }),

    toggleCommandPalette: () =>
      set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

    setTheme: (theme) => set({ theme }),
  }))
);
