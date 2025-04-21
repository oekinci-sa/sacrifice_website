"use client";

import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { sacrificeSchema } from "@/types";
import { supabase } from "@/utils/supabaseClient";
import { useQueryClient } from "@tanstack/react-query";
import { ReactNode, useCallback, useEffect, useRef } from "react";

interface SacrificeDataProviderProps {
  children: ReactNode;
}

export function SacrificeDataProvider({ children }: SacrificeDataProviderProps) {
  const queryClient = useQueryClient();
  const hasInitialized = useRef(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Get sacrifice store methods
  const {
    refetchSacrifices,
    updateSacrifice
  } = useSacrificeStore();

  // Setup Supabase Realtime subscription with useCallback
  const setupRealtimeSubscription = useCallback(() => {
    // Clean up existing subscription if any
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    // Create new subscription
    channelRef.current = supabase
      .channel("sacrifice-changes-" + Date.now())
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sacrifice_animals",
        },
        (payload) => {
          // Update Zustand store based on the event type
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            updateSacrifice(payload.new as sacrificeSchema);
            // Invalidate React Query cache
            queryClient.invalidateQueries({ queryKey: ["sacrifices"] });
          } else if (payload.eventType === "DELETE") {
            // For deletes, we need to refetch the whole list
            refetchSacrifices();
          }
        }
      )
      .subscribe();
  }, [queryClient, refetchSacrifices, updateSacrifice]);

  // Initial data fetch and real-time setup
  useEffect(() => {
    const initializeData = async () => {
      if (!hasInitialized.current) {
        hasInitialized.current = true;

        try {
          // First fetch fresh data from the database
          await refetchSacrifices();
          // Then set up real-time subscription
          setupRealtimeSubscription();
        } catch (error) {
          console.error("Error initializing sacrifice data:", error);
          // Reset initialization flag to try again next time
          hasInitialized.current = false;
        }
      }
    };

    initializeData();

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [refetchSacrifices, setupRealtimeSubscription]); // Include dependencies

  return <>{children}</>;
}
