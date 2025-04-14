import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/utils/supabaseClient"
import { sacrificeSchema } from "@/types"
import { useToast } from "@/components/ui/use-toast"
import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { useHisseStore } from "@/stores/useHisseStore"

// Fetch all sacrifices
export const useSacrifices = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const pathname = usePathname()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  
  // Get Zustand store methods
  const { sacrifices, setSacrifices, updateSacrifice, setIsLoadingSacrifices } = useHisseStore()

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
          
          // Invalidate React Query cache (keep existing behavior)
          queryClient.invalidateQueries({ queryKey: ["sacrifices"] })
          
          // Also update the Zustand store directly with the new data
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // For inserts and updates, update the specific record
            updateSacrifice(payload.new as sacrificeSchema)
          } else if (payload.eventType === 'DELETE') {
            // For deletes, we need to refetch the whole list
            // This is simpler than trying to remove just one item
            fetchAndUpdateStore()
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })
  }
  
  // Helper function to fetch data and update the store
  const fetchAndUpdateStore = async () => {
    try {
      setIsLoadingSacrifices(true)
      const response = await fetch('/api/get-sacrifice-animals')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || response.statusText)
      }
      
      const data = await response.json() as sacrificeSchema[]
      setSacrifices(data)
    } catch (error) {
      console.error('Error fetching sacrifices:', error)
    } finally {
      setIsLoadingSacrifices(false)
    }
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

  // Keep the original React Query hook, but make it also update our Zustand store
  return useQuery({
    queryKey: ["sacrifices"],
    queryFn: async () => {
      console.log('Fetching sacrifices data')
      setIsLoadingSacrifices(true)
      
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
      
      const data = await response.json() as sacrificeSchema[];
      
      // Update Zustand store with the fetched data
      setSacrifices(data);
      setIsLoadingSacrifices(false);
      
      return data;
    },
    initialData: () => sacrifices.length > 0 ? sacrifices : undefined, // Use store data if available
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
  const { updateSacrifice } = useHisseStore()

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

      const updatedSacrifice = await response.json();
      
      // Update Zustand store with the updated sacrifice
      updateSacrifice(updatedSacrifice);
      
      return updatedSacrifice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sacrifices"] })
    },
  })
}

// Tek bir kurbanlık için hook - ID'ye göre
export function useSacrificeById(id: string | undefined) {
  const queryClient = useQueryClient();
  const { sacrifices, updateSacrifice } = useHisseStore();
  
  // Try to get the sacrifice from the store first
  const cachedSacrifice = id ? sacrifices.find(s => s.sacrifice_id === id) : null;
  
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
      
      const sacrificeData = await response.json();
      
      // Update the store with this individual sacrifice
      if (sacrificeData) {
        updateSacrifice(sacrificeData);
      }
      
      return sacrificeData;
    },
    initialData: cachedSacrifice || undefined, // Use cached data if available
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
          
          // Update the Zustand store directly
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
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