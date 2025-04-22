import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { supabase } from "@/utils/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

// Anahtar isim tanımla
const EMPTY_SHARE_QUERY_KEY = "emptyShareCount";

export const useEmptyShareCount = () => {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Zustand store kullan
  const { totalEmptyShares, setEmptyShareCount } = useSacrificeStore();

  // Set up real-time subscription - sadece bir kez
  useEffect(() => {
    // Önceki aboneliği temizle
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    // Yeni realtime kanalı oluştur
    channelRef.current = supabase
      .channel(`sacrifice-empty-shares-${Date.now()}`)
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
      .subscribe();

    // Clean up subscription when component unmounts
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [queryClient]);

  // Verileri çek, ama çok sık değil
  const query = useQuery({
    queryKey: [EMPTY_SHARE_QUERY_KEY], // Basit bir anahtar kullan
    queryFn: async () => {
      // Sadece store boşsa API'dan çek
      if (totalEmptyShares <= 0) {
        const response = await fetch(`/api/get-empty-share-count`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch empty share count");
        }

        const data = await response.json();
        const currentValue = data.totalEmptyShares;

        // Zustand store'a kaydet
        setEmptyShareCount(currentValue);

        return currentValue;
      }

      // Store'da veri varsa onu kullan
      return totalEmptyShares;
    },
    // Initial data provided from store if available
    initialData: totalEmptyShares > 0 ? totalEmptyShares : undefined,
    // Cache and refetch settings
    staleTime: Infinity,
    gcTime: 0, // React Query v5 için
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: undefined,
  });

  return query;
};
