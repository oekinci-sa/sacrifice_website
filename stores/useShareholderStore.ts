import { create } from 'zustand'
import { supabase } from '@/utils/supabaseClient'
import { toast } from 'sonner'

interface Shareholder {
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
}

interface ShareholderStore {
  isLoading: boolean
  lastSubmissionTime: number | null
  createShareholders: (shareholders: Shareholder[]) => Promise<any>
}

const SUBMISSION_COOLDOWN = 2000 // 2 seconds cooldown between submissions

export const useShareholderStore = create<ShareholderStore>((set, get) => ({
  isLoading: false,
  lastSubmissionTime: null,

  createShareholders: async (shareholders) => {
    try {
      // Prevent empty data
      if (!shareholders?.length) {
        console.warn("Received empty shareholders data")
        return null
      }

      // Get current state
      const state = get()

      // Check if enough time has passed since last submission
      const now = Date.now()
      if (state.lastSubmissionTime && now - state.lastSubmissionTime < SUBMISSION_COOLDOWN) {
        console.warn("Submission attempted too soon after previous submission")
        return null
      }

      // Prevent duplicate submissions while loading
      if (state.isLoading) {
        console.warn("Previous submission still in progress")
        return null
      }

      // Update state
      set({ isLoading: true, lastSubmissionTime: now })

      // Validate phone numbers before submission
      const validatedShareholders = shareholders.map(shareholder => {
        if (!shareholder.phone_number.startsWith('+90') || shareholder.phone_number.length !== 13) {
          throw new Error(`Invalid phone number format for ${shareholder.shareholder_name}`)
        }
        return shareholder
      })

      const { data, error } = await supabase
        .from("shareholders")
        .insert(validatedShareholders)
        .select()

      if (error) {
        console.error("Supabase error details:", error)
        toast.error(`Hissedar bilgileri kaydedilirken bir hata oluştu: ${error.message}`)
        throw error
      }

      toast.success("Hissedar bilgileri başarıyla kaydedildi")
      return data
    } catch (error) {
      // Error is already handled above
      throw error
    } finally {
      set({ isLoading: false })
    }
  }
})) 