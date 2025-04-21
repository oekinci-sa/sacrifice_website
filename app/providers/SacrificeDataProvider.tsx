"use client";

import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { sacrificeSchema } from "@/types";
import { supabase } from "@/utils/supabaseClient";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { ReactNode, useEffect, useRef } from "react";

interface SacrificeDataProviderProps {
  children: ReactNode;
}

export function SacrificeDataProvider({
  children,
}: SacrificeDataProviderProps) {
  const queryClient = useQueryClient();
  const hasInitialized = useRef(false);

  // Zustand store hooks - only data related methods
  const {
    refetchSacrifices,
    updateSacrifice,
  } = useSacrificeStore();

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Initialize data fetching and subscription only once on component mount
  useEffect(() => {
    // Setup Supabase Realtime subscription
    const setupRealtimeSubscription = () => {
      // Clean up existing subscription if any
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      // Create new subscription
      channelRef.current = supabase
        .channel(`sacrifice-global-changes-${Date.now()}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "sacrifice_animals",
          },
          (payload: RealtimePostgresChangesPayload<sacrificeSchema>) => {
            console.log("Realtime update:", payload);

            // Zustand store ve React Query cache'i güncelle
            if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
              // Store'u güncelle
              updateSacrifice(payload.new as sacrificeSchema);

              // React Query cache'ini güncelle - tüm sorguyu invalidate etme
              // Bunun yerine cache'i doğrudan güncelle
              queryClient.setQueryData<sacrificeSchema[]>(["sacrifices"], (oldData) => {
                if (!oldData) return oldData;

                // Eski array'de elemanı bul ve güncelle
                const updatedData = [...oldData];
                const index = updatedData.findIndex(
                  (item) => item.sacrifice_id === payload.new.sacrifice_id
                );

                if (index >= 0) {
                  updatedData[index] = payload.new as sacrificeSchema;
                } else {
                  updatedData.push(payload.new as sacrificeSchema);
                }

                return updatedData;
              });

              // Ayrıca bireysel sorguları da güncelle
              queryClient.setQueryData(
                ["sacrifice", payload.new.sacrifice_id],
                payload.new
              );
            } else if (payload.eventType === "DELETE") {
              // Silme işlemi için tüm listeyi yeniden çekmek gerekir
              refetchSacrifices();
            }
          }
        )
        .subscribe();
    };

    if (!hasInitialized.current) {
      hasInitialized.current = true;
      refetchSacrifices();
      setupRealtimeSubscription();
    }

    // Check subscription status periodically
    const checkSubscription = setInterval(() => {
      if (!channelRef.current) {
        setupRealtimeSubscription();
      }
    }, 10000); // Check every 10 seconds

    // Cleanup on unmount
    return () => {
      clearInterval(checkSubscription);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [refetchSacrifices, updateSacrifice, queryClient]);

  return <>{children}</>;
}
