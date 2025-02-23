import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/utils/supabaseClient"
import { sacrificeSchema } from "@/types"
import { useToast } from "@/hooks/use-toast"
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
      const { data, error } = await supabase
        .from("sacrifice_animals")
        .select("*")
        .order("sacrifice_no", { ascending: true })

      if (error) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Veri yüklenirken bir hata oluştu: " + error.message
        })
        throw error
      }

      return data as sacrificeSchema[]
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
      const { error } = await supabase
        .from("sacrifice_animals")
        .update({ empty_share: emptyShare })
        .eq("sacrifice_id", sacrificeId)

      if (error) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Hisse seçimi yapılırken bir hata oluştu: " + error.message
        })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sacrifices"] })
    },
  })
} 