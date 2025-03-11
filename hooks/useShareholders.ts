import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/utils/supabaseClient"
import { useToast } from "@/components/ui/use-toast"
import { useEffect } from "react"
import { shareholderSchema } from "@/types"

// Using the standardized type from types/index.ts
export const useCreateShareholders = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (shareholders: Partial<shareholderSchema>[]) => {
      // Prevent empty data
      if (!shareholders || !shareholders.length) {
        throw new Error("Hissedar bilgileri boş olamaz")
      }

      // Validate phone numbers and required fields
      const validatedShareholders = shareholders.map(shareholder => {
        // Telefon numarası kontrolü
        let cleanedNumber = shareholder.phone_number?.trim() || ""
        
        // Eğer numara +900 ile başlıyorsa, fazladan 0'ı kaldır
        if (cleanedNumber.startsWith('+900')) {
          cleanedNumber = '+90' + cleanedNumber.slice(4)
        }

        if (!cleanedNumber.startsWith('+90') || cleanedNumber.length !== 13) {
          throw new Error(`Geçersiz telefon numarası formatı: ${cleanedNumber}. Format +90XXXXXXXXXX şeklinde olmalıdır.`)
        }
        
        // Zorunlu alanların kontrolü
        if (!shareholder.shareholder_name?.trim()) {
          throw new Error('Hissedar adı boş olamaz')
        }
        if (!shareholder.sacrifice_id) {
          throw new Error('Kurban ID boş olamaz')
        }
        if (!shareholder.share_price || shareholder.share_price <= 0) {
          throw new Error('Geçersiz hisse fiyatı')
        }

        return {
          ...shareholder,
          phone_number: cleanedNumber,
          paid_amount: 0,
          remaining_payment: shareholder.total_amount,
          sacrifice_consent: false,
          last_edited_by: shareholder.shareholder_name,
          purchased_by: shareholder.shareholder_name
        }
      })

      const { data, error } = await supabase
        .from("shareholders")
        .insert(validatedShareholders)
        .select()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onMutate: async (shareholders) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["shareholders"] })
      return { shareholders }
    },
    onError: (error: Error) => {
      console.error("Error in mutation:", error)
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Hissedar bilgileri kaydedilirken bir hata oluştu"
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["shareholders"] })
      toast({
        title: "Başarılı",
        description: "Hissedarlar başarıyla kaydedildi"
      })
    }
  })
}

// New hook for fetching shareholders with real-time updates
export const useGetShareholders = (searchQuery?: string) => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Define the query key including the search parameter
  const queryKey = searchQuery 
    ? ["shareholders", { search: searchQuery }] 
    : ["shareholders"]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from("shareholders")
        .select(`
          *,
          sacrifice:sacrifice_id (
            sacrifice_id,
            sacrifice_no,
            sacrifice_time,
            share_price
          )
        `)
        .order('purchase_time', { ascending: false })
      
      // Apply search filter if provided - keeping this for compatibility
      if (searchQuery) {
        const formattedSearch = searchQuery.toLowerCase()
        query = query.or(
          `shareholder_name.ilike.%${formattedSearch}%,phone_number.ilike.%${formattedSearch}%,sacrifice.sacrifice_no.ilike.%${formattedSearch}%`
        )
      }
      
      const { data, error } = await query
      
      if (error) {
        throw new Error(`Hissedar verileri alınamadı: ${error.message}`)
      }
      
      return data as shareholderSchema[]
    },
  })

  // Set up real-time subscription
  useEffect(() => {
    // Only set up subscription if the query was successful
    if (query.isSuccess) {
      const subscription = supabase
        .channel('shareholders-changes')
        .on('postgres_changes', 
          {
            event: '*', 
            schema: 'public',
            table: 'shareholders'
          }, 
          (payload) => {
            // Handle the different types of changes
            if (payload.eventType === 'INSERT') {
              // Fetch the complete record with joins
              supabase
                .from("shareholders")
                .select(`
                  *,
                  sacrifice:sacrifice_id (
                    sacrifice_id,
                    sacrifice_no,
                    sacrifice_time,
                    share_price
                  )
                `)
                .eq('shareholder_id', payload.new.shareholder_id)
                .single()
                .then(({ data, error }) => {
                  if (!error && data) {
                    // Update cache with the new record
                    queryClient.setQueryData(["shareholders"], (oldData: shareholderSchema[] | undefined) => {
                      if (!oldData) return [data as shareholderSchema]
                      return [data as shareholderSchema, ...oldData]
                    })
                  }
                })
            } else if (payload.eventType === 'UPDATE') {
              // Fetch the updated record with joins
              supabase
                .from("shareholders")
                .select(`
                  *,
                  sacrifice:sacrifice_id (
                    sacrifice_id,
                    sacrifice_no,
                    sacrifice_time,
                    share_price
                  )
                `)
                .eq('shareholder_id', payload.new.shareholder_id)
                .single()
                .then(({ data, error }) => {
                  if (!error && data) {
                    // Update the specific record in the cache
                    queryClient.setQueryData(["shareholders"], (oldData: shareholderSchema[] | undefined) => {
                      if (!oldData) return [data as shareholderSchema]
                      return oldData.map(item => 
                        item.shareholder_id === data.shareholder_id 
                          ? data as shareholderSchema 
                          : item
                      )
                    })
                  }
                })
            } else if (payload.eventType === 'DELETE') {
              // Remove the deleted record from the cache
              queryClient.setQueryData(["shareholders"], (oldData: shareholderSchema[] | undefined) => {
                if (!oldData) return []
                return oldData.filter(item => item.shareholder_id !== payload.old.shareholder_id)
              })
            }
        })
        .subscribe()

      // Clean up subscription on unmount
      return () => {
        subscription.unsubscribe()
      }
    }
  }, [query.isSuccess, queryClient])

  return query
}

// Update a shareholder
export const useUpdateShareholder = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      shareholderId,
      data
    }: {
      shareholderId: string
      data: Partial<shareholderSchema>
    }) => {
      const { error } = await supabase
        .from("shareholders")
        .update(data)
        .eq("shareholder_id", shareholderId)

      if (error) {
        throw new Error(`Hissedar güncellenemedi: ${error.message}`)
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["shareholders"] })
      
      // Also invalidate the specific shareholder query if it exists
      queryClient.invalidateQueries({ 
        queryKey: ["shareholder", variables.shareholderId] 
      })
      
      toast({
        title: "Başarılı",
        description: "Hissedar bilgileri başarıyla güncellendi."
      })
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Hissedar güncellenirken bir hata oluştu"
      })
    }
  })
}

// Delete a shareholder
export const useDeleteShareholder = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (shareholderId: string) => {
      // First, get the shareholder to obtain the sacrifice_id
      const { data: shareholder, error: fetchError } = await supabase
        .from("shareholders")
        .select("sacrifice_id")
        .eq("shareholder_id", shareholderId)
        .single()

      if (fetchError) {
        throw new Error(`Hissedar bilgisi alınamadı: ${fetchError.message}`)
      }

      const sacrificeId = shareholder.sacrifice_id

      // Now delete the shareholder
      const { error: deleteError } = await supabase
        .from("shareholders")
        .delete()
        .eq("shareholder_id", shareholderId)

      if (deleteError) {
        throw new Error(`Hissedar silinemedi: ${deleteError.message}`)
      }

      // Finally, update the empty_share value of the sacrifice animal
      if (sacrificeId) {
        // First, get the current empty_share value
        const { data: sacrifice, error: sacrificeError } = await supabase
          .from("sacrifice_animals")
          .select("empty_share")
          .eq("sacrifice_id", sacrificeId)
          .single()

        if (sacrificeError) {
          throw new Error(`Kurban bilgisi alınamadı: ${sacrificeError.message}`)
        }

        // Now increment the empty_share value
        const { error: updateError } = await supabase
          .from("sacrifice_animals")
          .update({
            empty_share: (sacrifice.empty_share || 0) + 1
          })
          .eq("sacrifice_id", sacrificeId)

        if (updateError) {
          throw new Error(`Kurban boş hisse değeri güncellenemedi: ${updateError.message}`)
        }
      }

      return { shareholderId, sacrificeId }
    },
    onSuccess: (result) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["shareholders"] })
      
      // Also invalidate sacrifice queries since we updated the empty_share
      if (result.sacrificeId) {
        queryClient.invalidateQueries({ queryKey: ["sacrifices"] })
      }
      
      toast({
        title: "Başarılı",
        description: "Hissedar başarıyla silindi ve kurban boş hisse sayısı güncellendi."
      })
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Hissedar silinirken bir hata oluştu"
      })
    }
  })
}