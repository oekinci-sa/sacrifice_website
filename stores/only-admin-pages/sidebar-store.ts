import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Sidebar state için tip tanımı
interface SidebarState {
  isCollapsed: boolean;
  expandedMenus: string[]; // Açık olan alt menülerin id'leri
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  toggleSubMenu: (menuId: string) => void;
  isSubMenuOpen: (menuId: string) => boolean;
  closeAllSubMenus: () => void;
}

// Zustand store'u oluştur ve persist middleware ekle
export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      isCollapsed: false,
      expandedMenus: [],
      
      setCollapsed: (collapsed) => set({ 
        isCollapsed: collapsed,
        // Sidebar daraltıldığında tüm alt menüleri kapat
        expandedMenus: collapsed ? [] : get().expandedMenus 
      }),
      
      toggleCollapsed: () => {
        const newCollapsedState = !get().isCollapsed;
        set({ 
          isCollapsed: newCollapsedState,
          // Sidebar daraltıldığında tüm alt menüleri kapat
          expandedMenus: newCollapsedState ? [] : get().expandedMenus
        });
      },
      
      toggleSubMenu: (menuId) => {
        const { expandedMenus } = get();
        const isOpen = expandedMenus.includes(menuId);
        
        set({
          expandedMenus: isOpen 
            ? expandedMenus.filter(id => id !== menuId) 
            : [...expandedMenus, menuId]
        });
      },
      
      isSubMenuOpen: (menuId) => {
        return get().expandedMenus.includes(menuId);
      },
      
      closeAllSubMenus: () => set({ expandedMenus: [] })
    }),
    {
      name: 'sidebar-storage', // localStorage'da kullanılacak anahtar
      storage: createJSONStorage(() => localStorage),
    }
  )
); 