import { shareholderSchema } from '@/types';
import { create } from 'zustand';

interface ShareholderState {
  shareholders: shareholderSchema[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  fetchShareholders: () => Promise<void>;
  setShareholders: (data: shareholderSchema[]) => void;
  updateShareholder: (shareholder: shareholderSchema) => void;
  addShareholder: (shareholder: shareholderSchema) => void;
  removeShareholder: (shareholderId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearShareholders: () => void;
}

export const useShareholderStore = create<ShareholderState>((set, get) => ({
  shareholders: [],
  isLoading: false,
  error: null,
  isInitialized: false,

  // Fetch shareholders from API
  fetchShareholders: async () => {
    // Skip if already initialized and has data
    if (get().isInitialized && get().shareholders.length > 0) {
      return;
    }

    try {
      set({ isLoading: true, error: null });

      const response = await fetch('/api/get-shareholders');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || response.statusText);
      }

      const data = await response.json();
      set({
        shareholders: data.shareholders || [], // Extract the shareholders array from the response
        isLoading: false,
        error: null,
        isInitialized: true
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false
      });
    }
  },

  // Set all shareholders
  setShareholders: (data) => set({
    shareholders: data,
    isLoading: false,
    error: null,
    isInitialized: true
  }),

  // Update a single shareholder
  updateShareholder: (shareholder) => set((state) => ({
    shareholders: state.shareholders.map(s =>
      s.shareholder_id === shareholder.shareholder_id ? shareholder : s
    ),
  })),

  // Add a new shareholder
  addShareholder: (shareholder) => set((state) => ({
    shareholders: [...state.shareholders, shareholder],
  })),

  // Remove a shareholder
  removeShareholder: (shareholderId) => set((state) => ({
    shareholders: state.shareholders.filter(s => s.shareholder_id !== shareholderId),
  })),

  // Set loading state
  setLoading: (isLoading) => set({ isLoading }),

  // Set error state
  setError: (error) => set({ error, isLoading: false }),

  // Clear all shareholders
  clearShareholders: () => set({ shareholders: [], error: null }),
})); 