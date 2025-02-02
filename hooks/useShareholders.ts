import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabaseClient";
import { toast } from "sonner";

interface ShareholderData {
  shareholder_name: string;
  phone_number: string;
  sacrifice_id: string;
  share_price: number;
  delivery_location: string;
  delivery_fee: number;
  total_amount: number;
  paid_amount: number;
  remaining_payment: number;
  sacrifice_consent: boolean;
  last_edited_by?: string;
  purchased_by?: string;
}

export const useCreateShareholders = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shareholders: ShareholderData[]) => {
      const { data, error } = await supabase
        .from("shareholders")
        .insert(shareholders)
        .select();

      if (error) {
        console.error("Supabase error details:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shareholders"] });
      toast.success("Hissedarlar başarıyla kaydedildi.");
    },
    onError: (error: any) => {
      toast.error(
        error.message === "value too long for type character varying(13)"
          ? "Telefon numarası formatı hatalı."
          : "Hissedarlar kaydedilirken bir hata oluştu."
      );
    },
  });
}; 