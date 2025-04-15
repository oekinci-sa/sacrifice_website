import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabaseClient";
import { sacrificeSchema } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSacrificeStore } from "@/stores/global/useSacrificeStore";

// Fetch all sacrifices
export const useSacrifices = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get Zustand store methods and state - data only
  const { sacrifices, isLoadingSacrifices } = useSacrificeStore();

  // We're now using React Query as a wrapper around our Zustand store
  // since the data is already being loaded and updated by SacrificeDataProvider
  return useQuery({
    queryKey: ["sacrifices"],
    queryFn: async () => {
      // If we already have data in the store, return it immediately
      if (sacrifices.length > 0) {
        return sacrifices;
      }

      // Otherwise fetch it from the API
      console.log("Fallback fetch for sacrifices data");
      const response = await fetch("/api/get-sacrifice-animals");

      if (!response.ok) {
        const errorData = await response.json();
        toast({
          variant: "destructive",
          title: "Hata",
          description:
            "Veri yüklenirken bir hata oluştu: " +
            (errorData.error || response.statusText),
        });
        throw new Error(errorData.error || response.statusText);
      }

      return (await response.json()) as sacrificeSchema[];
    },
    // Use the data directly from our store
    initialData: sacrifices.length > 0 ? sacrifices : undefined,
    // Set loading state from our store
    enabled: true,
    staleTime: 3000, // Consider data fresh for 3 seconds
    retry: 1,
  });
};

// Update sacrifice empty_share
export const useUpdateSacrifice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { updateSacrifice } = useSacrificeStore();

  return useMutation({
    mutationFn: async ({
      sacrificeId,
      emptyShare,
    }: {
      sacrificeId: string;
      emptyShare: number;
    }) => {
      // Using the new server-side API endpoint instead of direct Supabase access
      const response = await fetch("/api/update-sacrifice-share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sacrificeId, emptyShare }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast({
          variant: "destructive",
          title: "Hata",
          description:
            "Hisse seçimi yapılırken bir hata oluştu: " +
            (errorData.error || response.statusText),
        });
        throw new Error(errorData.error || response.statusText);
      }

      const updatedSacrifice = await response.json();

      // Update Zustand store with the updated sacrifice
      updateSacrifice(updatedSacrifice);

      return updatedSacrifice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sacrifices"] });
    },
  });
};

// Tek bir kurbanlık için hook - ID'ye göre
export function useSacrificeById(id: string | undefined) {
  const queryClient = useQueryClient();
  const { sacrifices, updateSacrifice } = useSacrificeStore();

  // Try to get the sacrifice from the store first
  const cachedSacrifice = id
    ? sacrifices.find((s) => s.sacrifice_id === id)
    : null;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["sacrifice", id],
    queryFn: async () => {
      if (!id) return null;

      // Check if we have the data in store first
      if (cachedSacrifice) {
        return cachedSacrifice;
      }

      // Otherwise fetch from API
      const response = await fetch(`/api/get-sacrifice-by-id?id=${id}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || response.statusText);
      }

      const sacrificeData = await response.json();

      // Update the store with this individual sacrifice
      if (sacrificeData) {
        updateSacrifice(sacrificeData);
      }

      return sacrificeData;
    },
    initialData: cachedSacrifice || undefined, // Use cached data if available
    enabled: !!id, // Sadece ID varsa sorguyu çalıştır
    staleTime: 3000, // Consider data fresh for 3 seconds
  });

  // Realtime desteği ekleniyor
  useEffect(() => {
    if (!id) return;

    // Individual sacrifice changes are now handled by the global provider
    // This is kept for backward compatibility and for component-specific updates

    // Kurbanlık değişikliklerini dinle
    const channel = supabase
      .channel(`sacrifice_changes:${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sacrifice_animals",
          filter: `sacrifice_id=eq.${id}`,
        },
        (payload) => {
          // Verileri yenile
          queryClient.invalidateQueries({ queryKey: ["sacrifice", id] });

          // Update the Zustand store directly
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            updateSacrifice(payload.new as sacrificeSchema);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient, updateSacrifice]);

  return { data, isLoading, error, refetch };
}
