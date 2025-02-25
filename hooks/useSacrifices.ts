import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/utils/supabaseClient"
import { sacrificeSchema } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { useEffect } from "react"

// Fetch all sacrifices
export const useSacrifices = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  useEffect(() => {
    const channel = supabase.channel('db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sacrifice_animals'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["sacrifices"] })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [queryClient])

  return useQuery({
    queryKey: ["sacrifices"],
    queryFn: async () => {
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
    staleTime: 0, // Disable stale time since we're using realtime
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