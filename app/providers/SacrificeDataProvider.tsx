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
  const isSubscribing = useRef(false);
  const isFetching = useRef(false);

  // Get sacrifice store methods
  const {
    sacrifices,
    refetchSacrifices,
    updateSacrifice
  } = useSacrificeStore();

  // Setup Supabase Realtime subscription with useCallback
  const setupRealtimeSubscription = useCallback(() => {
    // Prevent multiple subscription attempts
    if (isSubscribing.current) return;
    isSubscribing.current = true;

    try {
      // Clean up existing subscription if any
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }

      // Create new subscription with a unique channel name
      channelRef.current = supabase
        .channel(`sacrifice-changes-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`)
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
              refetchSacrifices().catch(error => {
                console.error("Error in refetching after delete:", error);
              });
            }
          }
        )
        .subscribe((status) => {
          // Log subscription status and reset flag
          console.log(`Supabase channel status: ${status}`);
          isSubscribing.current = false;
        });
    } catch (error) {
      console.error("Error setting up realtime subscription:", error);
      isSubscribing.current = false;
    }
  }, [queryClient, refetchSacrifices, updateSacrifice]);

  // Initial data fetch and real-time setup
  useEffect(() => {
    const initializeData = async () => {
      // Only initialize once and prevent concurrent fetches
      if (hasInitialized.current || isFetching.current) return;
      isFetching.current = true;

      try {
        // Skip fetching if we already have data
        if (sacrifices.length === 0) {
          // First fetch fresh data from the database
          await refetchSacrifices();
        }

        // Mark as initialized regardless of fetch result
        hasInitialized.current = true;

        // Then set up real-time subscription
        setupRealtimeSubscription();
      } catch (error) {
        console.error("Error initializing sacrifice data:", error);
      } finally {
        isFetching.current = false;
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
  }, [sacrifices.length, refetchSacrifices, setupRealtimeSubscription]);

  return <>{children}</>;
}
