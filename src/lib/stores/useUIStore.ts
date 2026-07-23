import { create } from 'zustand';

interface UIStoreState {
  isSidebarOpen: boolean;
  isSearchPaletteOpen: boolean;
  activeChatId: string | null;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchPaletteOpen: (open: boolean) => void;
  setActiveChatId: (id: string | null) => void;
}

export const useUIStore = create<UIStoreState>((set) => ({
  isSidebarOpen: true,
  isSearchPaletteOpen: false,
  activeChatId: null,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setSearchPaletteOpen: (open) => set({ isSearchPaletteOpen: open }),
  setActiveChatId: (id) => set({ activeChatId: id }),
}));
