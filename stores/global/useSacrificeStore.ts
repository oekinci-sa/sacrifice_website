import { sacrificeSchema } from '@/types';
import RealtimeManager from '@/utils/RealtimeManager';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Define the custom event name as a constant for consistency
export const SACRIFICE_UPDATED_EVENT = "sacrifice-updated";

export interface SacrificeState {
  // State
  sacrifices: sacrificeSchema[];
  isLoadingSacrifices: boolean;
  isRefetching: boolean;
  error: Error | null;
  isInitialized: boolean;
  totalEmptyShares: number;

  // Methods
  refetchSacrifices: () => Promise<sacrificeSchema[]>;
  updateSacrifice: (sacrifice: sacrificeSchema) => void;
  setEmptyShareCount: (count: number) => void;
  removeSacrifice: (sacrificeId: string) => void;

  // Realtime methods
  subscribeToRealtime: () => void;
  unsubscribeFromRealtime: () => void;

  // Event listener methods
  setupEventListeners: () => void;
  cleanupEventListeners: () => void;
}

export const useSacrificeStore = create<SacrificeState>()(
  devtools(
    (set, get) => ({
      // State
      sacrifices: [],
      isLoadingSacrifices: false,
      isRefetching: false,
      error: null,
      isInitialized: false,
      totalEmptyShares: 0,

      // Methods
      refetchSacrifices: async () => {
        const state = get();

        if (state.isRefetching || state.isLoadingSacrifices) {
          console.log("Store: Veri zaten yükleniyor, mevcut verileri döndürüyorum...");
          return state.sacrifices;
        }

        try {
          console.log("Store: Veri yüklemesi başlatılıyor...");
          set({ isLoadingSacrifices: true, isRefetching: true, error: null });

          const response = await fetch("/api/get-sacrifice-animals");
          console.log("Store: API yanıt durumu:", response.status);

          if (!response.ok) {
            const errorData = await response.json();
            console.error("Store: API yanıt hatası:", errorData);
            throw new Error(errorData.error || "Failed to fetch sacrifices");
          }

          const data = await response.json() as sacrificeSchema[];
          console.log("Store: Veriler başarıyla yüklendi, veri sayısı:", data.length);

          set({
            sacrifices: data,
            isLoadingSacrifices: false,
            isRefetching: false,
            isInitialized: true,
          });

          // Calculate empty shares
          const totalEmptyShares = data.reduce(
            (sum, sacrifice) => sum + sacrifice.empty_share,
            0
          );
          set({ totalEmptyShares });

          return data;
        } catch (error) {
          console.error("Store: Veri yükleme hatası:", error);
          set({
            isLoadingSacrifices: false,
            isRefetching: false,
            error: error instanceof Error ? error : new Error(String(error))
          });
          return get().sacrifices;
        }
      },

      updateSacrifice: (sacrifice: sacrificeSchema) => {
        console.log("Store: Sacrifice veri güncelleniyor:", sacrifice);

        // State güncellemeden önce orijinal ID'yi saklayalım
        const sacrificeId = sacrifice.sacrifice_id;

        set((state) => {
          const existingIndex = state.sacrifices.findIndex(
            (s) => s.sacrifice_id === sacrificeId
          );

          console.log(`Store: ${existingIndex === -1 ? 'Yeni kurban ekleniyor' : 'Mevcut kurban güncelleniyor'} ID: ${sacrificeId}`);

          // Mevcut dizide yoksa, ekle
          if (existingIndex === -1) {
            return { sacrifices: [...state.sacrifices, sacrifice] };
          }

          // Varsa, güncelle
          const updatedSacrifices = [...state.sacrifices];
          updatedSacrifices[existingIndex] = sacrifice;

          return { sacrifices: updatedSacrifices };
        });

        // State güncellemesi tamamlandıktan sonra event'i tetikle
        // setTimeout kullanmak micro-task queue'dan sonra çalışmasını sağlar
        setTimeout(() => {
          console.log("Store: SACRIFICE_UPDATED_EVENT tetikleniyor...");
          window.dispatchEvent(new CustomEvent(SACRIFICE_UPDATED_EVENT));
        }, 0);
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

      // Realtime methods
      subscribeToRealtime: () => {
        console.log("Supabase Realtime: sacrifice_animals tablosuna abone olunuyor...");

        // Önce mevcut abonelikleri temizle
        RealtimeManager.cleanup();

        // Sonra sacrifice_animals tablosuna abone ol
        RealtimeManager.subscribeToTable(
          "sacrifice_animals",
          (payload) => {
            console.log("Supabase Realtime: Yeni veri alındı:", payload);
            const { eventType, new: newData, old: oldData } = payload;

            if (eventType === "INSERT" || eventType === "UPDATE") {
              console.log("Supabase Realtime: Kurban verisi güncelleniyor:", newData);
              get().updateSacrifice(newData as sacrificeSchema);

              // Otomatik veri yenilemeyi önle - her değişiklik için tüm verileri yeniden çekme
              // setTimeout(() => {
              //   get().refetchSacrifices();
              // }, 300);
            } else if (eventType === "DELETE" && oldData?.sacrifice_id) {
              console.log("Supabase Realtime: Kurban verisi siliniyor:", oldData.sacrifice_id);
              get().removeSacrifice(oldData.sacrifice_id);
            }

            // Her türlü değişiklik için global event tetikle
            window.dispatchEvent(new CustomEvent(SACRIFICE_UPDATED_EVENT));
          }
        );

        // Ayrıca event listener'ları kur
        get().setupEventListeners();
      },

      unsubscribeFromRealtime: () => {
        console.log("Supabase Realtime: sacrifice_animals tablosundan abonelik kaldırılıyor...");

        // RealtimeManager handles cleanup internally

        // Clean up event listeners
        get().cleanupEventListeners();
      },

      // Event listener methods
      setupEventListeners: () => {
        // Event handler function for sacrifice-updated events
        const handleSacrificeUpdated = () => {
          console.log("Custom Event: sacrifice-updated event alındı, veriler yenileniyor...");
          get().refetchSacrifices();
        };

        // Add event listener for our custom sacrifice-updated event
        window.addEventListener(SACRIFICE_UPDATED_EVENT, handleSacrificeUpdated);

        // Store the handler function on window for cleanup
        (window as any).__sacrificeUpdatedHandler = handleSacrificeUpdated;
      },

      cleanupEventListeners: () => {
        // Remove event listener for sacrifice-updated event
        if ((window as any).__sacrificeUpdatedHandler) {
          window.removeEventListener(
            SACRIFICE_UPDATED_EVENT,
            (window as any).__sacrificeUpdatedHandler
          );
          delete (window as any).__sacrificeUpdatedHandler;
        }
      },
    }),
    { name: "sacrifice-store" }
  )
);
