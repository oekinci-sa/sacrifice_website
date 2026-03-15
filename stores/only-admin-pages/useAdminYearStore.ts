import { create } from "zustand";

interface AdminYearState {
  selectedYear: number | null;
  availableYears: number[];
  isLoading: boolean;
  isInitialized: boolean;

  setSelectedYear: (year: number) => void;
  fetchActiveYear: () => Promise<number>;
  fetchAvailableYears: () => Promise<number[]>;
  reset: () => void;
}

const initialState = {
  selectedYear: null as number | null,
  availableYears: [] as number[],
  isLoading: false,
  isInitialized: false,
};

export const useAdminYearStore = create<AdminYearState>((set, get) => ({
  ...initialState,

  setSelectedYear: (year) => set({ selectedYear: year }),

  fetchActiveYear: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/admin/active-year");
      if (!res.ok) throw new Error("Failed to fetch active year");
      const { activeYear, availableYears } = await res.json();
      set({
        selectedYear: activeYear,
        availableYears: availableYears ?? [activeYear],
        isLoading: false,
        isInitialized: true,
      });
      return activeYear;
    } catch {
      const fallback = new Date().getFullYear();
      set({
        selectedYear: fallback,
        availableYears: [fallback],
        isLoading: false,
        isInitialized: true,
      });
      return fallback;
    }
  },

  fetchAvailableYears: async () => {
    const { availableYears } = get();
    if (availableYears.length > 0) return availableYears;
    return get().fetchActiveYear().then(() => get().availableYears);
  },

  reset: () => set(initialState),
}));
