import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { sacrificeSchema, Step } from "@/types";
import { useQueryClient } from "@tanstack/react-query";

export interface FormData {
  name: string;
  phone: string;
  delivery_location: string;
}

export const STEP_MAPPING = {
  selection: { number: 1, value: "tab-1" },
  details: { number: 2, value: "tab-2" },
  confirmation: { number: 3, value: "tab-3" },
} as const;

interface HisseState {
  selectedSacrifice: sacrificeSchema | null;
  tempSelectedSacrifice: sacrificeSchema | null;
  formData: FormData[];
  currentStep: Step;
  stepNumber: number;
  tabValue: string;
  isSuccess: boolean;
  hasNavigatedAway: boolean;

  sacrifices: sacrificeSchema[];
  isLoadingSacrifices: boolean;
  
  // Veri yenileme durumu
  isRefetching: boolean;

  // Toplam boş hisse sayısı
  totalEmptyShares: number;

  // Store initialization state
  isInitialized: boolean;

  setSelectedSacrifice: (sacrifice: sacrificeSchema | null) => void;
  setTempSelectedSacrifice: (sacrifice: sacrificeSchema | null) => void;
  setFormData: (data: FormData[]) => void;
  resetStore: () => void;
  goToStep: (step: Step) => void;
  setSuccess: (value: boolean) => void;
  setHasNavigatedAway: (value: boolean) => void;

  setSacrifices: (sacrifices: sacrificeSchema[]) => void;
  updateSacrifice: (updatedSacrifice: sacrificeSchema) => void;
  setIsLoadingSacrifices: (isLoading: boolean) => void;
  setIsInitialized: (isInitialized: boolean) => void;
  
  // Veri yenileme için fonksiyon
  setIsRefetching: (isRefetching: boolean) => void;
  refetchSacrifices: () => Promise<sacrificeSchema[] | undefined>;

  // Toplam boş hisse sayısını güncellemek için fonksiyon
  setEmptyShareCount: (count: number) => void;

  // Utility function to remove a sacrifice by ID
  removeSacrifice: (sacrificeId: string) => void;
}

const initialState = {
  selectedSacrifice: null,
  tempSelectedSacrifice: null,
  formData: [],
  currentStep: "selection" as Step,
  stepNumber: 1,
  tabValue: "tab-1",
  isSuccess: false,
  hasNavigatedAway: false,

  sacrifices: [],
  isLoadingSacrifices: false,
  isRefetching: false,

  // Başlangıç değeri
  totalEmptyShares: 0,

  // Store initialization state
  isInitialized: false,
};

export const useSacrificeStore = create<HisseState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setSelectedSacrifice: (sacrifice) =>
        set({ selectedSacrifice: sacrifice }),
      setTempSelectedSacrifice: (sacrifice) =>
        set({ tempSelectedSacrifice: sacrifice }),
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
      setHasNavigatedAway: (value) => set({ hasNavigatedAway: value }),

      setSacrifices: (sacrifices) =>
        set({
          sacrifices,
          isInitialized: true,
        }),
      updateSacrifice: (updatedSacrifice) => {
        const currentSacrifices = [...get().sacrifices];
        const index = currentSacrifices.findIndex(
          (sacrifice) =>
            sacrifice.sacrifice_id === updatedSacrifice.sacrifice_id
        );

        if (index !== -1) {
          currentSacrifices[index] = updatedSacrifice;
          set({ sacrifices: currentSacrifices });

          if (
            get().selectedSacrifice?.sacrifice_id ===
            updatedSacrifice.sacrifice_id
          ) {
            set({ selectedSacrifice: updatedSacrifice });
          }

          if (
            get().tempSelectedSacrifice?.sacrifice_id ===
            updatedSacrifice.sacrifice_id
          ) {
            set({ tempSelectedSacrifice: updatedSacrifice });
          }

          // Update total empty shares when a sacrifice is updated
          const totalEmptyShares = currentSacrifices.reduce(
            (sum, sacrifice) => sum + sacrifice.empty_share,
            0
          );
          set({ totalEmptyShares });
        } else {
          const newSacrifices = [...currentSacrifices, updatedSacrifice];

          // Update total empty shares when adding a new sacrifice
          const totalEmptyShares = newSacrifices.reduce(
            (sum, sacrifice) => sum + sacrifice.empty_share,
            0
          );

          set({
            sacrifices: newSacrifices,
            totalEmptyShares,
          });
        }
      },
      setIsLoadingSacrifices: (isLoadingSacrifices) =>
        set({ isLoadingSacrifices }),
      setIsInitialized: (isInitialized) => set({ isInitialized }),
      
      // Yeni eklediklerimiz
      setIsRefetching: (isRefetching) => set({ isRefetching }),
      
      // Veri yenileme fonksiyonu - artık Zustand store'da
      refetchSacrifices: async () => {
        try {
          set({ isRefetching: true });
          set({ isLoadingSacrifices: true });
          console.log("Zustand store: Fetching sacrifice data");

          const response = await fetch("/api/get-sacrifice-animals");

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || response.statusText);
          }

          const data = (await response.json()) as sacrificeSchema[];

          // Set the data in Zustand store
          set({ 
            sacrifices: data,
            isInitialized: true
          });

          // Calculate and update total empty shares
          const totalEmptyShares = data.reduce(
            (sum, sacrifice) => sum + sacrifice.empty_share,
            0
          );
          set({ totalEmptyShares });

          return data;
        } catch (error) {
          console.error("Error fetching sacrifices:", error);
          return undefined;
        } finally {
          set({ isLoadingSacrifices: false });
          set({ isRefetching: false });
        }
      },

      // Toplam boş hisse sayısını güncelleme fonksiyonu
      setEmptyShareCount: (count) => set({ totalEmptyShares: count }),

      // Function to remove a sacrifice by ID
      removeSacrifice: (sacrificeId) => {
        const currentSacrifices = [...get().sacrifices];
        const updatedSacrifices = currentSacrifices.filter(
          (sacrifice) => sacrifice.sacrifice_id !== sacrificeId
        );

        // Update total empty shares
        const totalEmptyShares = updatedSacrifices.reduce(
          (sum, sacrifice) => sum + sacrifice.empty_share,
          0
        );

        set({
          sacrifices: updatedSacrifices,
          totalEmptyShares,
        });

        // If selected sacrifice is removed, clear it
        if (get().selectedSacrifice?.sacrifice_id === sacrificeId) {
          set({ selectedSacrifice: null });
        }

        if (get().tempSelectedSacrifice?.sacrifice_id === sacrificeId) {
          set({ tempSelectedSacrifice: null });
        }
      },
    }),
    { name: "hisse-store" }
  )
);
