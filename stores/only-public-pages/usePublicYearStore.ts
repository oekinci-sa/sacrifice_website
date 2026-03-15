import { create } from "zustand";

interface PublicYearState {
  selectedYear: number | null;
  availableYears: number[];
  isInitialized: boolean;

  setSelectedYear: (year: number) => void;
  fetchActiveYear: (yearFromUrl?: number | null) => Promise<number>;
  reset: () => void;
}

const initialState = {
  selectedYear: null as number | null,
  availableYears: [] as number[],
  isInitialized: false,
};

export const usePublicYearStore = create<PublicYearState>((set, get) => ({
  ...initialState,

  setSelectedYear: (year) => set({ selectedYear: year }),

  fetchActiveYear: async (yearFromUrl?: number | null) => {
    const url = yearFromUrl != null
      ? `/api/public/active-year?year=${yearFromUrl}`
      : "/api/public/active-year";
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch public active year");
    const { year, availableYears } = await res.json();
    set({
      selectedYear: year,
      availableYears: availableYears ?? [year],
      isInitialized: true,
    });
    return year;
  },

  reset: () => set(initialState),
}));
