import { create } from 'zustand';
import { getMenuTree, type MenuNode } from '../modules/system/menu/api';

let menuFetchSeq = 0;

interface MenuState {
  menuTree: MenuNode[];
  loading: boolean;
  fetchMenuTree: () => Promise<void>;
  resetMenuTree: () => void;
}

export const useMenuStore = create<MenuState>((set) => ({
  menuTree: [],
  loading: false,
  fetchMenuTree: async () => {
    const currentSeq = ++menuFetchSeq;
    set({ loading: true });
    try {
      const data = await getMenuTree({ scope: 'nav' });
      if (currentSeq === menuFetchSeq) {
        set({ menuTree: data, loading: false });
      }
    } catch {
      if (currentSeq === menuFetchSeq) {
        set({ loading: false });
      }
    }
  },
  resetMenuTree: () => {
    menuFetchSeq += 1;
    set({ menuTree: [], loading: false });
  },
}));
