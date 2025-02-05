import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { sacrificeSchema } from '@/types'

export interface FormData {
  name: string
  phone: string
  delivery_location: string
}

export type Step = "selection" | "details" | "confirmation" | "success"

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
  setSelectedSacrifice: (sacrifice: sacrificeSchema | null) => void
  setTempSelectedSacrifice: (sacrifice: sacrificeSchema | null) => void
  setFormData: (data: FormData[]) => void
  resetStore: () => void
  goToStep: (step: Step) => void
  setSuccess: (value: boolean) => void
}

const initialState = {
  selectedSacrifice: null,
  tempSelectedSacrifice: null,
  formData: [],
  currentStep: "selection" as Step,
  stepNumber: 1,
  tabValue: "tab-1",
  isSuccess: false,
}

export const useHisseStore = create<HisseState>()(
  devtools(
    (set) => ({
      ...initialState,
      
      setSelectedSacrifice: (sacrifice) => set({ selectedSacrifice: sacrifice }),
      setTempSelectedSacrifice: (sacrifice) => set({ tempSelectedSacrifice: sacrifice }),
      setFormData: (data) => set({ formData: data }),
      resetStore: () => set(initialState),
      goToStep: (step) => {
        let stepNumber = 1;
        let tabValue = "tab-1";

        switch (step) {
          case "selection":
            stepNumber = 1;
            tabValue = "tab-1";
            break;
          case "details":
            stepNumber = 2;
            tabValue = "tab-2";
            break;
          case "confirmation":
            stepNumber = 3;
            tabValue = "tab-3";
            break;
          case "success":
            stepNumber = 3;
            tabValue = "tab-3";
            break;
        }

        set({ currentStep: step, stepNumber, tabValue });
      },
      setSuccess: (value) => set({ isSuccess: value }),
    }),
    { name: 'hisse-store' }
  )
)