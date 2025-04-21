import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { supabase } from "@/utils/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

// Anahtar isim tanımla
const EMPTY_SHARE_QUERY_KEY = "emptyShareCount";

export const useEmptyShareCount = () => {
  const queryClient = useQueryClient();

  // Zustand store kullan
  const { setEmptyShareCount } = useSacrificeStore();

  // Set up real-time subscription - sadece bir kez
  useEffect(() => {

    // Tüm subscription'ları tek bir channel'da birleştirelim
    const channel = supabase
      .channel("sacrifice-animals-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Tüm event'ları dinle (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "sacrifice_animals",
        },
        () => {
          // Değişiklik olduğunda, query'i geçersiz kıl ve yeniden çek
          queryClient.invalidateQueries({ queryKey: [EMPTY_SHARE_QUERY_KEY] });
        }
      )
      .subscribe();


    // Clean up subscription when component unmounts
    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);

  // Verileri çek, ama çok sık değil
  const query = useQuery({
    queryKey: [EMPTY_SHARE_QUERY_KEY], // Basit bir anahtar kullan
    queryFn: async () => {

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
    },
    // Otomatik yenileme yok - sadece invalidate olduğunda
    refetchInterval: undefined,
    // 5 dakika boyunca verileri taze say
    staleTime: 5 * 60 * 1000,
    // Sayfa yeniden açıldığında bir kez yenile
    refetchOnWindowFocus: true,
    // Cache süresi
    gcTime: 10 * 60 * 1000,
  });

  return query;
};
