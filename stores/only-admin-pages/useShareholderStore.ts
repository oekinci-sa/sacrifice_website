import { create } from 'zustand';
import { shareholderSchema } from '@/types';

interface ShareholderState {
  shareholders: shareholderSchema[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setShareholders: (data: shareholderSchema[]) => void;
  updateShareholder: (shareholder: shareholderSchema) => void;
  addShareholder: (shareholder: shareholderSchema) => void;
  removeShareholder: (shareholderId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearShareholders: () => void;
}

export const useShareholderStore = create<ShareholderState>((set) => ({
  shareholders: [],
  isLoading: false,
  error: null,
  
  // Set all shareholders
  setShareholders: (data) => set({ shareholders: data, isLoading: false, error: null }),
  
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