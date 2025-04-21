import { sacrificeSchema } from "@/types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface SacrificeState {
  sacrifices: sacrificeSchema[];
  isLoadingSacrifices: boolean;
  isRefetching: boolean;
  totalEmptyShares: number;
  isInitialized: boolean;
  sacrificesInitialized: boolean;

  setSacrifices: (sacrifices: sacrificeSchema[]) => void;
  updateSacrifice: (updatedSacrifice: sacrificeSchema) => void;
  setIsLoadingSacrifices: (isLoading: boolean) => void;
  setIsInitialized: (isInitialized: boolean) => void;
  setIsRefetching: (isRefetching: boolean) => void;
  refetchSacrifices: () => Promise<sacrificeSchema[]>;
  setEmptyShareCount: (count: number) => void;
  removeSacrifice: (sacrificeId: string) => void;
}

const initialState = {
  sacrifices: [],
  isLoadingSacrifices: false,
  isRefetching: false,
  totalEmptyShares: 0,
  isInitialized: false,
  sacrificesInitialized: false,
};

export const useSacrificeStore = create<SacrificeState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setSacrifices: (sacrifices) =>
        set({
          sacrifices,
          isInitialized: true,
          sacrificesInitialized: true,
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

      setIsRefetching: (isRefetching) => set({ isRefetching }),

      refetchSacrifices: async () => {
        const state = get();

        try {
          set({ isLoadingSacrifices: true });

          // API'dan verileri çek
          const response = await fetch("/api/get-sacrifice-animals");

          if (!response.ok) {
            throw new Error("Failed to fetch sacrifices");
          }

          const data = await response.json() as sacrificeSchema[];

          // Store'u güncelle
          set({
            sacrifices: data,
            isLoadingSacrifices: false,
            sacrificesInitialized: true,
            isInitialized: true,
          });

          // Calculate and update total empty shares
          const totalEmptyShares = data.reduce(
            (sum, sacrifice) => sum + sacrifice.empty_share,
            0
          );
          set({ totalEmptyShares });

          return data;
        } catch (error) {
          set({ isLoadingSacrifices: false });
          console.error("Error fetching sacrifices:", error);
          return state.sacrifices;
        }
      },

      setEmptyShareCount: (count) => set({ totalEmptyShares: count }),

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
      },
    }),
    { name: "sacrifice-store" }
  )
);
