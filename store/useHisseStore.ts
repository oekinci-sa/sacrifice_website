import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { sacrificeSchema } from '@/types'

interface FormData {
  name: string
  phone: string
  delivery_location: string
}

export type Step = "selection" | "details" | "confirmation"

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
  setCurrentStep: (step: Step) => void
  resetStore: () => void
  goToStep: (step: Step) => void
  getStepNumber: () => number
  getTabValue: () => string
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
    (set, get) => ({
      ...initialState,
      
      setSelectedSacrifice: (sacrifice) => set({ selectedSacrifice: sacrifice }),
      setTempSelectedSacrifice: (sacrifice) => set({ tempSelectedSacrifice: sacrifice }),
      setFormData: (data) => set({ formData: data }),
      setCurrentStep: (step) => set({ currentStep: step }),
      resetStore: () => set({
        selectedSacrifice: null,
        tempSelectedSacrifice: null,
        formData: [],
        currentStep: "selection",
        stepNumber: 1,
        tabValue: "tab-1"
      }),
      goToStep: (step) => {
        const stepMapping = {
          selection: { number: 1, value: "tab-1" },
          details: { number: 2, value: "tab-2" },
          confirmation: { number: 3, value: "tab-3" }
        };

        set({
          currentStep: step,
          stepNumber: stepMapping[step].number,
          tabValue: stepMapping[step].value
        });
      },
      getStepNumber: () => get().stepNumber,
      getTabValue: () => get().tabValue,
    }),
    { name: 'hisse-store' }
  )
) 