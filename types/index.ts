import { z } from "zod";

// Form için Zod şeması
export const shareholderFormSchema = z.object({
  shareholder_name: z.string().min(1, { message: "Ad soyad zorunludur" }),
  phone_number: z.string().min(10, { message: "Geçerli bir telefon numarası giriniz" }),
  total_amount: z.number(),
  paid_amount: z.number(),
  remaining_payment: z.number(),
  delivery_fee: z.number(),
  delivery_location: z.enum(["kesimhane", "yenimahalle-pazar-yeri", "kecioren-otoparki"]),
  sacrifice_consent: z.boolean(),
  notes: z.string(),
});

// Form için tip
export type ShareholderFormValues = z.infer<typeof shareholderFormSchema>;

export interface shareholderSchema {
  // Temel alanlar
  shareholder_id: string;
  shareholder_name: string;
  phone_number: string;
  purchase_time: string;
  sacrifice_id: string;
  security_code: string; // Veritabanındaki security_code alanı (varchar(6))
  
  // Ödeme ile ilgili alanlar
  delivery_fee: number;
  share_price: number;
  total_amount: number;
  paid_amount: number;
  remaining_payment: number;
  
  // Teslimat ve onay
  delivery_location: "kesimhane" | "yenimahalle-pazar-yeri" | "kecioren-otoparki";
  sacrifice_consent: boolean;
  
  // Düzenleme bilgileri
  last_edited_time: string | null;
  last_edited_by: string | null;
  notes: string | null;
  
  // İlişkili kurban bilgileri (opsiyonel)
  sacrifice?: {
    sacrifice_id: string;
    sacrifice_no: string;
    sacrifice_time?: string;
    share_price?: number;
  };
}

export interface sacrificeSchema {
  // Temel alanlar
  sacrifice_id: string;
  sacrifice_no: number;
  sacrifice_time: string | null;
  
  // Hisse bilgileri
  share_price: number;
  share_weight: number;
  empty_share: number;
  
  // Düzenleme bilgileri
  last_edited_time: string | null;
  last_edited_by: string | null;
  notes: string | null;
  
  // İlişkili hissedar bilgileri (opsiyonel)
  shareholders?: Partial<shareholderSchema>[];
}

export interface changeLogSchema {
  event_id: number
  table_name: string
  row_id: string
  column_name: string
  old_value: string | null
  new_value: string | null
  change_type: string
  description: string
  change_owner: string
  changed_at: string
}

export type UserRole = "admin" | "editor" | null;

// Hisse alma adımlarını temsil eden tip
export type Step = string;