import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { supabase } from "@/utils/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";

// Anahtar isim tanımla
const EMPTY_SHARE_QUERY_KEY = "emptyShareCount";

export const useEmptyShareCount = () => {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isSubscribing = useRef(false);

  // Zustand store kullan
  const { totalEmptyShares, setEmptyShareCount } = useSacrificeStore();

  // Create setup function with useCallback
  const setupRealtimeChannel = useCallback(() => {
    // Prevent multiple subscription attempts
    if (isSubscribing.current) return;
    isSubscribing.current = true;

    try {
      // Önceki aboneliği temizle
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }

      // Create a unique channel name to avoid conflicts
      const channelName = `sacrifice-empty-shares-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Yeni realtime kanalı oluştur
      channelRef.current = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "sacrifice_animals",
          },
          () => {
            // Değişiklik olduğunda, query'i geçersiz kıl ve cache update et
            queryClient.invalidateQueries({ queryKey: [EMPTY_SHARE_QUERY_KEY] });
          }
        )
        .subscribe((status) => {
          console.log(`Empty share count subscription status: ${status}`);
          isSubscribing.current = false;
        });
    } catch (error) {
      console.error("Error setting up empty share count subscription:", error);
      isSubscribing.current = false;
    }
  }, [queryClient]);

  // Set up real-time subscription - sadece bir kez
  useEffect(() => {
    // Set up the channel
    setupRealtimeChannel();

    // Clean up subscription when component unmounts
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [setupRealtimeChannel]);

  // Verileri çek, ama çok sık değil
  const query = useQuery({
    queryKey: [EMPTY_SHARE_QUERY_KEY], // Basit bir anahtar kullan
    queryFn: async () => {
      // If we already have data in the store, return it immediately
      if (totalEmptyShares > 0) {
        return totalEmptyShares;
      }

      try {
        // Cache busting için timestamp
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/get-empty-share-count?t=${timestamp}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch empty share count");
        }

        const data = await response.json();
        const currentValue = data.totalEmptyShares;

        // Zustand store'a kaydet
        setEmptyShareCount(currentValue);

        return currentValue;
      } catch (error) {
        console.error("Error fetching empty share count:", error);
        // Return current store value if available, otherwise 0
        return totalEmptyShares || 0;
      }
    },
    // Initial data provided from store if available
    initialData: totalEmptyShares > 0 ? totalEmptyShares : undefined,
    // Disable automatic refetching - rely on invalidation from realtime
    refetchInterval: undefined,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Set stale time to 0 to always consider data stale
    staleTime: 0,
    // Cache süresi
    gcTime: 10 * 60 * 1000,
  });

  return query;
};
