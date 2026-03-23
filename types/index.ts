import { z } from "zod";

// Re-export types from the reservation module
export * from './reservation';
// Re-export types from the sacrifice module
export * from './sacrifice';

// Form için Zod şeması
export const shareholderFormSchema = z.object({
  shareholder_name: z.string().min(1, { message: "Ad soyad zorunludur" }),
  phone_number: z.string().min(10, { message: "Geçerli bir telefon numarası giriniz" }),
  total_amount: z.number(),
  paid_amount: z.number(),
  remaining_payment: z.number(),
  delivery_fee: z.number(),
  delivery_location: z.string().min(1, "Teslimat tercihi seçiniz"),
  sacrifice_consent: z.boolean(),
  notes: z.string(),
});

// Form için tip
export type ShareholderFormValues = z.infer<typeof shareholderFormSchema>;

export interface TenantSchema {
  id: string;
  slug: string;
  name: string;
  status: string;
  created_at?: string;
}

export type HomepageMode = "anasayfa" | "thanks" | "takip";
export type HomepageLayout = "default" | "golbasi" | "kahramankazan";

export interface TenantSettings {
  tenant_id: string;
  theme_json: Record<string, unknown> | null;
  homepage_mode?: HomepageMode | null;
  homepage_layout?: HomepageLayout | null;
  active_sacrifice_year?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface shareholderSchema {
  // Temel alanlar
  shareholder_id: string;
  tenant_id: string;
  sacrifice_year: number;
  shareholder_name: string;
  phone_number: string | null;
  second_phone_number?: string | null;
  purchase_time: string;
  sacrifice_id: string;
  security_code: string | null; // Veritabanındaki security_code alanı (varchar(6))
  purchased_by: string | null;

  // Ödeme ile ilgili alanlar (share_price sacrifice_animals ile JOIN'den alınır)
  delivery_fee: number | null;
  total_amount: number;
  paid_amount: number;
  remaining_payment: number;

  // Teslimat ve onay
  delivery_location: string | null;
  delivery_type?: string | null; // Kesimhane | Adrese teslim | Ulus
  sacrifice_consent: boolean | null;
  transaction_id: string | null;

  // Düzenleme bilgileri
  last_edited_time: string | null;
  last_edited_by: string | null;
  /** API: admin listesinde gösterim (DB'de e-posta) */
  last_edited_by_display?: string | null;
  notes: string | null;

  // Görüşüldü bilgisi (yeni kayıt takibi)
  contacted_at: string | null;

  // İlişkili kurban bilgileri (opsiyonel)
  sacrifice?: {
    sacrifice_id: string;
    sacrifice_no: string;
    sacrifice_time?: string;
    /** Planlı kesim + 1,5 saat (DB generated) */
    planned_delivery_time?: string | null;
    share_price?: number;
    share_weight?: number | string;
  };
}

export interface sacrificeSchema {
  // Temel alanlar
  sacrifice_id: string;
  tenant_id: string;
  sacrifice_no: number;
  sacrifice_time: string;
  sacrifice_year: number;

  // Hisse bilgileri
  share_price: number;
  share_weight: number;
  empty_share: number;
  /** Hayvan cinsi (DANA, DÜVE vb.) */
  animal_type: string | null;
  /** Vakıf kodu (AKV, İMH, AGD) veya boş */
  foundation?: string | null;
  /** Planlı kesim saatine +1,5 saat (DB generated) */
  planned_delivery_time?: string | null;
  /** Yıl + 4 haneli sıra (DB generated) */
  ear_tag_display?: string | null;

  // Düzenleme bilgileri
  last_edited_time: string | null;
  last_edited_by: string | null;
  notes: string | null;

  slaughter_time: string | null;
  butcher_time: string | null;
  delivery_time: string | null;

  // İlişkili hissedar bilgileri (opsiyonel)
  shareholders?: Partial<shareholderSchema>[];
}

export interface changeLogSchema {
  event_id: number;
  table_name: string;
  row_id: string;
  column_name: string | null;
  old_value: string | null;
  new_value: string | null;
  change_type: string;
  description: string;
  change_owner: string;
  changed_at: string | null;
  tenant_id: string | null;
  sacrifice_year: number | null;
}

export type UserRole = "admin" | "editor" | "super_admin" | null;
export type UserStatus = "pending" | "approved" | "blacklisted";

export interface UserSchema {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  status: UserStatus | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserTenantSchema {
  user_id: string;
  tenant_id: string;
  approved_at?: string | null;
}

// Hisse alma adımlarını temsil eden tip
export type Step = "selection" | "details" | "confirmation" | "success";