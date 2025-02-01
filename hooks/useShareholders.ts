import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { supabase } from "@/utils/supabaseClient"

interface ShareholderData {
  shareholder_name: string
  phone_number: string
  delivery_location: string
  delivery_fee: number
  share_price: number
  total_amount: number
  paid_amount: number
  remaining_payment: number
  sacrifice_consent: boolean
  last_edited_by: string
  purchased_by: string
  sacrifice_id: string
}

export const useCreateShareholders = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (shareholders: ShareholderData[]) => {
      try {
        const { data, error } = await supabase
          .from("shareholders")
          .insert(shareholders)
          .select()

        if (error) {
          toast.error("Hissedar bilgileri kaydedilirken bir hata oluştu.")
          throw error
        }

        return data
      } catch (error) {
        toast.error("Hissedar bilgileri kaydedilirken bir hata oluştu.")
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shareholders"] })
    },
  })
} 