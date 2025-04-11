import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/utils/supabaseClient"
import { sacrificeSchema } from "@/types"
import { useToast } from "@/components/ui/use-toast"
import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

// Fetch all sacrifices
export const useSacrifices = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const pathname = usePathname()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Function to setup Supabase subscription
  const setupSubscription = () => {
    // Clean up existing subscription if any
    if (channelRef.current) {
      channelRef.current.unsubscribe()
    }

    // Create new subscription
    channelRef.current = supabase.channel('sacrifice-changes-' + Date.now())
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sacrifice_animals'
        },
        (payload) => {
          console.log('Realtime update received:', payload)
          queryClient.invalidateQueries({ queryKey: ["sacrifices"] })
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })
  }

  // Setup subscription on mount and pathname change
  useEffect(() => {
    setupSubscription()
    // Force immediate refetch when pathname changes
    queryClient.invalidateQueries({ queryKey: ["sacrifices"] })

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        console.log('Unsubscribing from channel')
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    }
  }, [pathname, queryClient]) // Add pathname as dependency

  // Monitor subscription status
  useEffect(() => {
    const checkSubscription = setInterval(() => {
      if (!channelRef.current) {
        console.log('Reestablishing lost subscription')
        setupSubscription()
      }
    }, 5000) // Check every 5 seconds

    return () => clearInterval(checkSubscription)
  }, [])

  return useQuery({
    queryKey: ["sacrifices"],
    queryFn: async () => {
      console.log('Fetching sacrifices data')
      
      // Using the new server-side API endpoint instead of direct Supabase access
      const response = await fetch('/api/get-sacrifice-animals');
      
      if (!response.ok) {
        const errorData = await response.json();
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Veri yüklenirken bir hata oluştu: " + (errorData.error || response.statusText)
        });
        throw new Error(errorData.error || response.statusText);
      }
      
      const data = await response.json();
      return data as sacrificeSchema[];
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 1000, // Give a small stale time to prevent excessive refetches
    retry: 3
  })
}

// Update sacrifice empty_share
export const useUpdateSacrifice = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      sacrificeId,
      emptyShare,
    }: {
      sacrificeId: string
      emptyShare: number
    }) => {
      // Using the new server-side API endpoint instead of direct Supabase access
      const response = await fetch('/api/update-sacrifice-share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sacrificeId, emptyShare })
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Hisse seçimi yapılırken bir hata oluştu: " + (errorData.error || response.statusText)
        });
        throw new Error(errorData.error || response.statusText);
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sacrifices"] })
    },
  })
}

// Tek bir kurbanlık için hook - ID'ye göre
export function useSacrificeById(id: string | undefined) {
  const queryClient = useQueryClient();
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sacrifice', id],
    queryFn: async () => {
      if (!id) return null;
      
      // Using the new server-side API endpoint instead of direct Supabase access
      const response = await fetch(`/api/get-sacrifice-by-id?id=${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || response.statusText);
      }
      
      return await response.json();
    },
    enabled: !!id, // Sadece ID varsa sorguyu çalıştır
  });

  // Realtime desteği ekleniyor
  useEffect(() => {
    if (!id) return;
    
    // Kurbanlık değişikliklerini dinle
    const channel = supabase
      .channel(`sacrifice_changes:${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sacrifice_animals',
          filter: `sacrifice_id=eq.${id}`
        },
        (payload) => {
          // Verileri yenile
          queryClient.invalidateQueries({ queryKey: ['sacrifice', id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  return { data, isLoading, error, refetch };
} 