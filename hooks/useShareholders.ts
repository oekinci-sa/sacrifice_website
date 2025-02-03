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

  return useMutation({
    mutationFn: async (shareholders: ShareholderData[]) => {
      // Prevent empty data
      if (!shareholders || !shareholders.length) {
        throw new Error("Hissedar bilgileri boş olamaz")
      }

      // Validate phone numbers and required fields
      const validatedShareholders = shareholders.map(shareholder => {
        // Telefon numarası kontrolü
        let cleanedNumber = shareholder.phone_number.trim()
        
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