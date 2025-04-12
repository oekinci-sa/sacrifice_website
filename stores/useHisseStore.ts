import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { sacrificeSchema, Step } from '@/types'

export interface FormData {
  name: string
  phone: string
  delivery_location: string
}

export const STEP_MAPPING = {
  selection: { number: 1, value: "tab-1" },
  details: { number: 2, value: "tab-2" },
  confirmation: { number: 3, value: "tab-3" }
} as const;

interface HisseState {
  selectedSacrifice: sacrificeSchema | null
  tempSelectedSacrifice: sacrificeSchema | null
  formData: FormData[]
  currentStep: Step
  stepNumber: number
  tabValue: string
  isSuccess: boolean
  
  sacrifices: sacrificeSchema[]
  isLoadingSacrifices: boolean
  
  setSelectedSacrifice: (sacrifice: sacrificeSchema | null) => void
  setTempSelectedSacrifice: (sacrifice: sacrificeSchema | null) => void
  setFormData: (data: FormData[]) => void
  resetStore: () => void
  goToStep: (step: Step) => void
  setSuccess: (value: boolean) => void
  
  setSacrifices: (sacrifices: sacrificeSchema[]) => void
  updateSacrifice: (updatedSacrifice: sacrificeSchema) => void
  setIsLoadingSacrifices: (isLoading: boolean) => void
}

const initialState = {
  selectedSacrifice: null,
  tempSelectedSacrifice: null,
  formData: [],
  currentStep: "selection" as Step,
  stepNumber: 1,
  tabValue: "tab-1",
  isSuccess: false,
  
  sacrifices: [],
  isLoadingSacrifices: false,
}

export const useHisseStore = create<HisseState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      setSelectedSacrifice: (sacrifice) => set({ selectedSacrifice: sacrifice }),
      setTempSelectedSacrifice: (sacrifice) => set({ tempSelectedSacrifice: sacrifice }),
      setFormData: (data) => set({ formData: data }),
      resetStore: () => set(initialState),
      goToStep: (step) => {
        let tab = "tab-1";
        if (step === "details") tab = "tab-2";
        if (step === "confirmation") tab = "tab-3";
        if (step === "success") tab = "tab-4";
        set({ currentStep: step, tabValue: tab });
      },
      setSuccess: (value) => set({ isSuccess: value }),
      
      setSacrifices: (sacrifices) => set({ sacrifices }),
      updateSacrifice: (updatedSacrifice) => {
        const currentSacrifices = [...get().sacrifices];
        const index = currentSacrifices.findIndex(
          sacrifice => sacrifice.sacrifice_id === updatedSacrifice.sacrifice_id
        );
        
        if (index !== -1) {
          currentSacrifices[index] = updatedSacrifice;
          set({ sacrifices: currentSacrifices });
          
          if (get().selectedSacrifice?.sacrifice_id === updatedSacrifice.sacrifice_id) {
            set({ selectedSacrifice: updatedSacrifice });
          }
          
          if (get().tempSelectedSacrifice?.sacrifice_id === updatedSacrifice.sacrifice_id) {
            set({ tempSelectedSacrifice: updatedSacrifice });
          }
        } else {
          set({ sacrifices: [...currentSacrifices, updatedSacrifice] });
        }
      },
      setIsLoadingSacrifices: (isLoadingSacrifices) => set({ isLoadingSacrifices }),
    }),
    { name: 'hisse-store' }
  )
)