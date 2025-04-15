"use client";

import { ReactNode, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabaseClient";
import { sacrificeSchema } from "@/types";
import { useSacrificeStore } from "@/stores/useSacrificeStore";
import { useToast } from "@/components/ui/use-toast";

interface SacrificeDataProviderProps {
  children: ReactNode;
}

export function SacrificeDataProvider({
  children,
}: SacrificeDataProviderProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const hasInitialized = useRef(false);
  
  // Zustand store hooks - only data related methods
  const {
    refetchSacrifices,
    updateSacrifice,
  } = useSacrificeStore();
  
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Setup Supabase Realtime subscription
  const setupRealtimeSubscription = () => {
    // Clean up existing subscription if any
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    // Create new subscription
    channelRef.current = supabase
      .channel("sacrifice-global-changes-" + Date.now())
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sacrifice_animals",
        },
        (payload) => {
          console.log("Realtime update received:", payload);

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
      .subscribe((status) => {
        console.log("Global subscription status:", status);
      });
  };

  // Initialize data fetching and subscription only once on component mount
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      refetchSacrifices();
      setupRealtimeSubscription();
    }

    // Check subscription status periodically
    const checkSubscription = setInterval(() => {
      if (!channelRef.current) {
        console.log("Reestablishing lost subscription");
        setupRealtimeSubscription();
      }
    }, 10000); // Check every 10 seconds

    // Cleanup on unmount
    return () => {
      clearInterval(checkSubscription);
      if (channelRef.current) {
        console.log("Unsubscribing from global channel");
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [refetchSacrifices]);

  return <>{children}</>;
}
