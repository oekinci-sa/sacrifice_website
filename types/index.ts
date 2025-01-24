import { z } from "zod";

// Form için Zod şeması
export const shareholderFormSchema = z.object({
  shareholder_name: z.string().min(1, { message: "Ad soyad zorunludur" }),
  phone_number: z.string().min(10, { message: "Geçerli bir telefon numarası giriniz" }),
  total_amount: z.number(),
  paid_amount: z.number(),
  remaining_payment: z.number(),
  delivery_fee: z.number(),
  delivery_type: z.enum(["kesimhane", "toplu-teslimat"]),
  delivery_location: z.enum(["yenimahalle-camii", "kecioren-pazar"]),
  sacrifice_consent: z.boolean(),
  notes: z.string(),
});

// Form için tip
export type ShareholderFormValues = z.infer<typeof shareholderFormSchema>;

// Statik alanlar için tip
export interface StaticShareholderFields {
  purchase_time: string;
  sacrifice_no: number;
  last_edited_by: string;
}

export interface shareholderSchema {
  shareholder_id: string;
  shareholder_name: string;
  phone_number: string;
  purchase_time: string;
  total_amount: number;
  paid_amount: number;
  remaining_payment: number;
  payment_status: "paid" | "pending";
  sacrifice_consent: "verildi" | "bekleniyor";
  delivery_fee?: number;
  delivery_type?: "kesimhane" | "toplu-teslimat";
  delivery_location?: string;
  notes?: string;
  last_edited_by?: string;
}

export interface sacrificeSchema {
  sacrifice_id: string;
  sacrifice_no: number;
  sacrifice_time: string;
  share_price: number;
  empty_share: number;
  notes?: string;
  added_at: string;
  last_edited_by?: string;
}

export interface ShareholderType {
  shareholder_id: string
  shareholder_name: string
  phone_number: string
  purchase_time: string
  sacrifice_id: string
  delivery_fee: number
  share_price: number
  total_amount: number
  paid_amount: number
  remaining_payment: number
  delivery_type: "kesimhane" | "toplu-teslim-noktasi"
  delivery_location: "kesimhane" | "yenimahalle-pazar-yeri" | "kecioren-otoparki"
  sacrifice_consent: boolean
  last_edited_time: string
  last_edited_by: string
  notes?: string
  sacrifice?: {
    sacrifice_id: string
    sacrifice_no: string
  }
}
