import { logReservationRealtime } from "@/lib/debug-reservation-realtime";
import { supabase } from "@/utils/supabaseClient";
import { create } from "zustand";
import { useAdminYearStore } from "./useAdminYearStore";

interface ActiveReservationsCountState {
  count: number;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  realtimeEnabled: boolean;

  fetchCount: (year?: number | null, options?: { silent?: boolean }) => Promise<void>;
  enableRealtime: () => void;
  disableRealtime: () => void;
}

const setupRealtimeSubscription = (get: () => ActiveReservationsCountState) => {
  logReservationRealtime("[BADGE] Realtime channel oluşturuluyor...");
  const channel = supabase
    .channel("active-reservations-badge")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "reservation_transactions",
      },
      () => {
        const year = useAdminYearStore.getState().selectedYear;
        void get().fetchCount(year, { silent: true });
      }
    )
    .subscribe((status) => {
      logReservationRealtime("[BADGE] Channel subscription status:", status);
    });

  return channel;
};

export const useActiveReservationsCountStore = create<ActiveReservationsCountState>((set, get) => {
  let channelRef: ReturnType<typeof supabase.channel> | null = null;

  return {
    count: 0,
    isLoading: false,
    error: null,
    isInitialized: false,
    realtimeEnabled: false,

    fetchCount: async (year?: number | null, options?: { silent?: boolean }) => {
      const silent = options?.silent === true;
      logReservationRealtime("[BADGE] fetchCount çağrıldı, year:", year);
      try {
        if (!silent) set({ isLoading: true, error: null });

        const url =
          year != null
            ? `/api/admin/active-reservations-count?year=${year}`
            : "/api/admin/active-reservations-count";
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch count");
        const json = await res.json();
        const count = typeof json.count === "number" ? json.count : 0;
        logReservationRealtime("[BADGE] fetchCount sonuç:", count);

        set({
          count,
          isLoading: false,
          error: null,
          isInitialized: true,
        });

        if (!get().realtimeEnabled) {
          get().enableRealtime();
        }
      } catch (err) {
        logReservationRealtime("[BADGE] fetchCount hata:", err);
        set({
          count: 0,
          isLoading: false,
          error: err instanceof Error ? err.message : "Unknown error",
          isInitialized: true,
        });
      }
    },

    enableRealtime: () => {
      logReservationRealtime("[BADGE] enableRealtime çağrıldı");
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
