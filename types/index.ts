import { z } from "zod";

// Form için Zod şeması
export const shareholderFormSchema = z.object({
  shareholder_name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  phone_number: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
  total_amount_to_pay: z.number().min(0, "Geçerli bir tutar giriniz"),
  deposit_payment: z.number().min(0, "Geçerli bir kapora tutarı giriniz"),
  remaining_payment: z.number().min(0, "Geçerli bir kalan ödeme tutarı giriniz"),
  payment_status: z.enum(["paid", "pending"], {
    required_error: "Ödeme durumu seçiniz",
  }),
  delivery_fee: z.number().min(0, "Geçerli bir teslimat ücreti giriniz"),
  delivery_type: z.enum(["kesimhane", "toplu-teslimat"], {
    required_error: "Teslimat türü seçiniz",
  }),
  delivery_location: z.enum(["yenimahalle-camii", "kecioren-pazar"], {
    required_error: "Teslimat noktası seçiniz",
  }).optional(),
  vekalet: z.boolean().default(false),
  notes: z.string().optional(),
});

// Form için tip
export type ShareholderFormValues = z.infer<typeof shareholderFormSchema>;

// Statik alanlar için tip
export interface StaticShareholderFields {
  purchase_time: string;
  sacrifice_no: number;
  last_edited_by: string;
}

export interface ShareholderFormValues {
  shareholder_id: string;
  shareholder_name: string;
  phone_number: string;
  total_amount_to_pay: number;
  deposit_payment: number;
  remaining_payment: number;
  payment_status: "paid" | "pending";
  delivery_fee: number;
  delivery_type: "kesimhane" | "toplu-teslimat";
  delivery_location?: "yenimahalle-camii" | "kecioren-pazar";
  vekalet: boolean;
  notes?: string;
}