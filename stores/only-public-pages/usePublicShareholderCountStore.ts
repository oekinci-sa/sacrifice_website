import { supabase } from "@/utils/supabaseClient";
import { create } from "zustand";

interface PublicShareholderCountState {
  count: number;
  isLoading: boolean;
  error: string | null;
  realtimeEnabled: boolean;
  lastFetchedYear: number | null;

  fetchCount: (
    year: number | null,
    options?: { silent?: boolean }
  ) => Promise<void>;
  enableRealtime: () => void;
  disableRealtime: () => void;
}

const setupRealtimeSubscription = (get: () => PublicShareholderCountState) => {
  return supabase
    .channel("public-shareholders-count")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "shareholders",
      },
      () => {
        const y = get().lastFetchedYear;
        void get().fetchCount(y, { silent: true });
      }
    )
    .subscribe();
};

export const usePublicShareholderCountStore =
  create<PublicShareholderCountState>((set, get) => {
    let channelRef: ReturnType<typeof supabase.channel> | null = null;

    return {
      count: 0,
      isLoading: false,
      error: null,
      realtimeEnabled: false,
      lastFetchedYear: null,

      fetchCount: async (year, options) => {
        const silent = options?.silent === true;
        try {
          if (!silent) set({ isLoading: true, error: null });
          set({ lastFetchedYear: year });

          const url =
            year != null
              ? `/api/public/shareholders-count?year=${year}`
              : "/api/public/shareholders-count";
          const res = await fetch(url);
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(
              typeof err?.error === "string" ? err.error : "Sayım alınamadı"
            );
          }
          const json = await res.json();
          const count = typeof json.count === "number" ? json.count : 0;
          set({
            count,
            isLoading: false,
            error: null,
          });

          if (!get().realtimeEnabled) {
            get().enableRealtime();
          }
        } catch (e) {
          set({
            count: 0,
            isLoading: false,
            error: e instanceof Error ? e.message : "Bilinmeyen hata",
          });
        }
      },

      enableRealtime: () => {
        if (channelRef) {
          supabase.removeChannel(channelRef);
        }
        channelRef = setupRealtimeSubscription(get);
        set({ realtimeEnabled: true });
      },

      disableRealtime: () => {
        if (channelRef) {
          supabase.removeChannel(channelRef);
          channelRef = null;
        }
        set({ realtimeEnabled: false });
      },
    };
  });
