/**
 * Tüm Hissedarlar tablosu: sütun id → başlık (tablo, sütun seçici, Excel, filtre butonları).
 * Filtre başlığı sütunla aynı olduğunda bu map’ten okunur.
 */
export const hissedarlarColumnHeaderLabels: Record<string, string> = {
  sacrifice_no: "Kurban No",
  shareholder_name: "İsim Soyisim",
  contacted_at: "Görüşüldü",
  phone_number: "Telefon",
  email: "E-posta",
  second_phone_number: "İkinci Telefon",
  sacrifice_info: "Hisse Bilgisi",
  delivery_location: "Teslimat Tercihi",
  delivery_location_raw: "Teslimat Yeri",
  payment_status: "Ödeme",
  notes: "Notlar",
  purchase_time: "Kayıt Tarihi",
  sacrifice_consent: "Vekalet",
  last_edited_time: "Son Güncelleme",
  last_edited_by: "Son Güncelleyen",
  share_count: "Hisse Sayısı",
  total_amount: "Toplam Tutar",
  paid_amount: "Ödenen Tutar",
  remaining_payment: "Kalan Ödeme",
  pdf: "PDF",
  actions: "",
};
