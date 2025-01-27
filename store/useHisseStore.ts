import { create } from 'zustand'
import { sacrificeSchema } from '@/types'

interface FormData {
  name: string
  phone: string
  delivery_type: "kesimhane" | "toplu-teslim-noktasi"
  delivery_location: string
}

type Step = "selection" | "details" | "confirmation"

interface HisseState {
  selectedSacrifice: sacrificeSchema | null
  tempSelectedSacrifice: sacrificeSchema | null
  formData: FormData[]
  currentStep: Step
  setSelectedSacrifice: (sacrifice: sacrificeSchema | null) => void
  setTempSelectedSacrifice: (sacrifice: sacrificeSchema | null) => void
  setFormData: (data: FormData[]) => void
  setCurrentStep: (step: Step) => void
  resetStore: () => void
}

const initialState = {
  selectedSacrifice: null,
  tempSelectedSacrifice: null,
  formData: [],
  currentStep: "selection" as Step,
}

export const useHisseStore = create<HisseState>((set) => ({
  ...initialState,
  
  setSelectedSacrifice: (sacrifice) => set({ selectedSacrifice: sacrifice }),
  setTempSelectedSacrifice: (sacrifice) => set({ tempSelectedSacrifice: sacrifice }),
  setFormData: (data) => set({ formData: data }),
  setCurrentStep: (step) => set({ currentStep: step }),
  resetStore: () => set(initialState),
})) 