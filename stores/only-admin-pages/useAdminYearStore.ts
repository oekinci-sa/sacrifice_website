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

const ADMIN_YEAR_KEY = "admin:selectedYear";

const initialState = {
  selectedYear: null as number | null,
  availableYears: [] as number[],
  isLoading: false,
  isInitialized: false,
};

export const useAdminYearStore = create<AdminYearState>((set, get) => ({
  ...initialState,

  setSelectedYear: (year) => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(ADMIN_YEAR_KEY, String(year));
      }
    } catch {
      // sessionStorage unavailable
    }
    set({ selectedYear: year });
  },

  fetchActiveYear: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/admin/active-year");
      if (!res.ok) throw new Error("Failed to fetch active year");
      const { activeYear, availableYears } = await res.json();
      const years = availableYears ?? [activeYear];

      let finalYear = activeYear;
      try {
        if (typeof window !== "undefined") {
          const stored = sessionStorage.getItem(ADMIN_YEAR_KEY);
          if (stored != null) {
            const parsed = parseInt(stored, 10);
            if (!Number.isNaN(parsed) && years.includes(parsed)) {
              finalYear = parsed;
            }
          }
        }
      } catch {
        // sessionStorage unavailable
      }

      set({
        selectedYear: finalYear,
        availableYears: years,
        isLoading: false,
        isInitialized: true,
      });
      return finalYear;
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
