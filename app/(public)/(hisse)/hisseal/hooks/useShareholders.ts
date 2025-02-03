"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/utils/supabaseClient"
import { useToast } from "@/hooks/use-toast"

interface ShareholderData {
  shareholder_name: string
  phone_number: string
  delivery_location: string
  delivery_fee: number
  share_price: number
  total_amount: number
  sacrifice_consent: boolean
  last_edited_by: string
  sacrifice_id: string
}

export const useCreateShareholders = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (shareholders: ShareholderData[]) => {
      const { data, error } = await supabase
        .from("shareholders")
        .insert(shareholders)
        .select()

      if (error) {
        throw error
      }

      return data
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Hissedarlar başarıyla kaydedildi",
      })
      queryClient.invalidateQueries({ queryKey: ["shareholders"] })
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Hissedarlar kaydedilirken bir hata oluştu: " + error.message,
      })
    },
  })
} 
