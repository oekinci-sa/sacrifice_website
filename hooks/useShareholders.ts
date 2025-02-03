import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/utils/supabaseClient"
import { useToast } from "@/hooks/use-toast"

interface ShareholderData {
  shareholder_name: string
  phone_number: string
  sacrifice_id: string
  share_price: number
  delivery_location: string
  delivery_fee: number
  total_amount: number
  paid_amount: number
  remaining_payment: number
  sacrifice_consent: boolean
  last_edited_by: string
  purchased_by: string
}

export const useCreateShareholders = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  let hasCalled = false

  return useMutation({
    mutationKey: ["createShareholders"],
    mutationFn: async (shareholders: ShareholderData[]) => {
      console.log("Mutation received data:", shareholders)

      // Prevent duplicate calls
      if (hasCalled) {
        console.warn("Mutation has already been called, preventing duplicate call")
        return null
      }
      hasCalled = true

      // Prevent empty data
      if (!shareholders || !shareholders.length) {
        console.warn("Mutation received empty data, aborting")
        return null
      }

      // Validate phone numbers and required fields
      const validatedShareholders = shareholders.map(shareholder => {
        if (!shareholder.phone_number.startsWith('+90') || shareholder.phone_number.length !== 13) {
          throw new Error(`Invalid phone number format for ${shareholder.shareholder_name}`)
        }
        
        // Ensure all required fields are present
        if (!shareholder.shareholder_name || !shareholder.sacrifice_id || !shareholder.share_price) {
          throw new Error('Missing required fields')
        }

        return {
          ...shareholder,
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
        console.error("Supabase error details:", error)
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Hissedar bilgileri kaydedilirken bir hata oluştu: " + error.message
        })
        throw error
      }

      toast({
        title: "Başarılı",
        description: "Hissedarlar başarıyla kaydedildi"
      })
      
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shareholders"] })
    }
  })
} 