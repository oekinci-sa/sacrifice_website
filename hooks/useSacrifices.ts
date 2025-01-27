import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/utils/supabaseClient"
import { sacrificeSchema } from "@/types"
import { toast } from "sonner"
import { useEffect } from "react"

// Fetch all sacrifices
export const useSacrifices = () => {
  const queryClient = useQueryClient()

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
          // Invalidate and refetch
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
        toast.error("Veri yüklenirken bir hata oluştu: " + error.message)
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
        toast.error("Hisse seçimi yapılırken bir hata oluştu: " + error.message)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sacrifices"] })
    },
  })
}

// Create shareholders
export const useCreateShareholders = () => {
  const queryClient = useQueryClient()
  let hasCalled = false

  return useMutation({
    mutationKey: ["createShareholders"],
    mutationFn: async (shareholders: any[]) => {
      console.log("Mutation received data:", shareholders)

      // Prevent duplicate calls
      if (hasCalled) {
        console.warn("Mutation has already been called, preventing duplicate call")
        return
      }
      hasCalled = true

      // Prevent empty data
      if (!shareholders || !shareholders.length) {
        console.warn("Mutation received empty data, aborting")
        return
      }

      const { data, error } = await supabase
        .from("shareholders")
        .insert(shareholders)
        .select()

      if (error) {
        console.error("Supabase error details:", error)
        toast.error(`Hissedar bilgileri kaydedilirken bir hata oluştu: ${error.message}`)
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shareholders"] })
    }
  })
} 