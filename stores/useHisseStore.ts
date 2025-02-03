import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { sacrificeSchema } from '@/types'

export interface FormData {
  name: string
  phone: string
  delivery_location: string
}

export type Step = "selection" | "details" | "confirmation"

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
  setSelectedSacrifice: (sacrifice: sacrificeSchema | null) => void
  setTempSelectedSacrifice: (sacrifice: sacrificeSchema | null) => void
  setFormData: (data: FormData[]) => void
  resetStore: () => void
  goToStep: (step: Step) => void
}

const initialState = {
  selectedSacrifice: null,
  tempSelectedSacrifice: null,
  formData: [],
  currentStep: "selection" as Step,
  stepNumber: 1,
  tabValue: "tab-1",
}

export const useHisseStore = create<HisseState>()(
  devtools(
    (set) => ({
      ...initialState,
      
      setSelectedSacrifice: (sacrifice) => set({ selectedSacrifice: sacrifice }),
      setTempSelectedSacrifice: (sacrifice) => set({ tempSelectedSacrifice: sacrifice }),
      setFormData: (data) => set({ formData: data }),
      resetStore: () => set(initialState),
      goToStep: (step) => set({
        currentStep: step,
        stepNumber: STEP_MAPPING[step].number,
        tabValue: STEP_MAPPING[step].value
      }),
    }),
    { name: 'hisse-store' }
  )
)