import { resolveTenantIdFromHost } from '@/lib/tenant-resolver';
import { sacrificeSchema } from '@/types';
import RealtimeManager from '@/utils/RealtimeManager';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Define the custom event name as a constant for consistency
export const SACRIFICE_UPDATED_EVENT = "sacrifice-updated";

/** Realtime (anon) tüm tenant’lardaki satır değişimlerini iletir; API ise tek tenant filtreler. Bu kapsamla yanlış tenant/yıl birleşimi engellenir. */
function matchesSacrificeRealtimeScope(
  row: { tenant_id?: string; sacrifice_year?: number } | null | undefined,
  state: {
    realtimeScopeTenantId: string | null;
    realtimeScopeSacrificeYear: number | null;
  }
): boolean {
  if (!row?.tenant_id) return false;
  const expectedTenant =
    state.realtimeScopeTenantId ??
    (typeof window !== "undefined" ? resolveTenantIdFromHost(window.location.host) : null);
  if (!expectedTenant || row.tenant_id !== expectedTenant) return false;
  const expectedYear = state.realtimeScopeSacrificeYear;
  if (expectedYear != null && row.sacrifice_year !== expectedYear) return false;
  return true;
}

export interface SacrificeState {
  // State
  sacrifices: sacrificeSchema[];
  isLoadingSacrifices: boolean;
  isRefetching: boolean;
  error: Error | null;
  isInitialized: boolean;
  totalEmptyShares: number;
  /** Son başarılı listeleme / host ile uyumlu tenant (realtime filtre) */
  realtimeScopeTenantId: string | null;
  /** Seçili kurban yılı (realtime filtre); API ile aynı yıl */
  realtimeScopeSacrificeYear: number | null;

  // Methods
  refetchSacrifices: (year?: number | null) => Promise<sacrificeSchema[]>;
  updateSacrifice: (sacrifice: sacrificeSchema) => void;
  setEmptyShareCount: (count: number) => void;
  removeSacrifice: (sacrificeId: string) => void;

  // Realtime methods
  subscribeToRealtime: () => void;
  unsubscribeFromRealtime: () => void;
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
      realtimeScopeTenantId: null,
      realtimeScopeSacrificeYear: null,

      // Methods
      refetchSacrifices: async (year?: number | null) => {
        const state = get();

        if (state.isRefetching || state.isLoadingSacrifices) {
          return state.sacrifices;
        }

        try {
          set({ isLoadingSacrifices: true, isRefetching: true, error: null });

          const url = year != null
            ? `/api/get-sacrifice-animals?year=${year}`
            : "/api/get-sacrifice-animals";
          const response = await fetch(url);

          if (!response.ok) {
            const errorData = await response.json();
            console.error("Store: API yanıt hatası:", errorData);
            throw new Error(errorData.error || "Failed to fetch sacrifices");
          }

          const data = await response.json() as sacrificeSchema[];

          const prev = get();
          const tenantScope =
            data[0]?.tenant_id ??
            prev.realtimeScopeTenantId ??
            (typeof window !== "undefined" ? resolveTenantIdFromHost(window.location.host) : null);
          const yearScope =
            data[0]?.sacrifice_year ??
            (year != null ? year : prev.realtimeScopeSacrificeYear);

          const totalEmptyShares = data.reduce(
            (sum, sacrifice) => sum + sacrifice.empty_share,
            0
          );

          set({
            sacrifices: data,
            isLoadingSacrifices: false,
            isRefetching: false,
            isInitialized: true,
            totalEmptyShares,
            realtimeScopeTenantId: tenantScope,
            realtimeScopeSacrificeYear: yearScope ?? null,
          });

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

        // State güncellemeden önce orijinal ID'yi saklayalım
        const sacrificeId = sacrifice.sacrifice_id;

        set((state) => {
          const existingIndex = state.sacrifices.findIndex(
            (s) => s.sacrifice_id === sacrificeId
          );


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

        // Önce mevcut abonelikleri temizle
        RealtimeManager.cleanup();

        // Sonra sacrifice_animals tablosuna abone ol
        RealtimeManager.subscribeToTable(
          "sacrifice_animals",
          (payload) => {
            const { eventType, new: newData, old: oldData } = payload;
            const st = get();

            if (eventType === "INSERT" || eventType === "UPDATE") {
              if (!matchesSacrificeRealtimeScope(newData as sacrificeSchema, st)) {
                return;
              }
              get().updateSacrifice(newData as sacrificeSchema);

              // Otomatik veri yenilemeyi önle - her değişiklik için tüm verileri yeniden çekme
              // setTimeout(() => {
              //   get().refetchSacrifices();
              // }, 300);
            } else if (eventType === "DELETE" && oldData?.sacrifice_id) {
              if (!matchesSacrificeRealtimeScope(oldData as sacrificeSchema, st)) {
                return;
              }
              get().removeSacrifice(oldData.sacrifice_id);
              window.dispatchEvent(new CustomEvent(SACRIFICE_UPDATED_EVENT));
            }

            // INSERT/UPDATE: updateSacrifice zaten SACRIFICE_UPDATED_EVENT tetikler
          }
        );
      },

      unsubscribeFromRealtime: () => {
        RealtimeManager.cleanup();
      },
    }),
    { name: "sacrifice-store" }
  )
);
