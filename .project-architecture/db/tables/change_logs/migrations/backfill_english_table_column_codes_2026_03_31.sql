-- Mevcut change_logs satırları: table_name / column_name Türkçe → İngilizce kod (UI çeviri lib ile).
-- Sıra: önce user_tenants ayrımı, sonra genel table_name, sonra column_name.

-- 1) Kullanıcılar (eski) → user_tenants / users ayrımı
UPDATE public.change_logs
SET table_name = 'user_tenants'
WHERE table_name = 'Kullanıcılar'
  AND (
    description LIKE '%ikinci bir organizasyonda%'
    OR description LIKE '%onaylı üye% kaydı kaldırıldı%'
  );

UPDATE public.change_logs
SET table_name = 'users'
WHERE table_name = 'Kullanıcılar';

-- 2) Diğer tablo adları
UPDATE public.change_logs SET table_name = 'sacrifice_animals' WHERE table_name = 'Kurbanlıklar';
UPDATE public.change_logs SET table_name = 'shareholders' WHERE table_name = 'Hissedarlar';
UPDATE public.change_logs SET table_name = 'mismatched_share_acknowledgments' WHERE table_name = 'Hisse Uyumsuzluğu';
UPDATE public.change_logs SET table_name = 'stage_metrics' WHERE table_name = 'Aşama Metrikleri';

-- 3) sacrifice_animals kolonları
UPDATE public.change_logs SET column_name = 'sacrifice_no' WHERE table_name = 'sacrifice_animals' AND column_name = 'Kurban Numarası';
UPDATE public.change_logs SET column_name = 'share_weight' WHERE table_name = 'sacrifice_animals' AND column_name = 'Hisse Ağırlığı (kg)';
UPDATE public.change_logs SET column_name = 'share_price' WHERE table_name = 'sacrifice_animals' AND column_name = 'Hisse Bedeli';
UPDATE public.change_logs SET column_name = 'empty_share' WHERE table_name = 'sacrifice_animals' AND column_name = 'Boş Hisse';
UPDATE public.change_logs SET column_name = 'pricing_mode' WHERE table_name = 'sacrifice_animals' AND column_name = 'Fiyatlama Modu';
UPDATE public.change_logs SET column_name = 'live_scale_total_kg' WHERE table_name = 'sacrifice_animals' AND column_name = 'Canlı Baskül Toplam (kg)';
UPDATE public.change_logs SET column_name = 'live_scale_total_price' WHERE table_name = 'sacrifice_animals' AND column_name = 'Canlı Baskül Toplam Tutar';
UPDATE public.change_logs SET column_name = 'notes' WHERE table_name = 'sacrifice_animals' AND column_name = 'Notlar';
UPDATE public.change_logs SET column_name = 'animal_type' WHERE table_name = 'sacrifice_animals' AND column_name = 'Hayvan Cinsi';
UPDATE public.change_logs SET column_name = 'foundation' WHERE table_name = 'sacrifice_animals' AND column_name = 'Vakıf';
UPDATE public.change_logs SET column_name = 'ear_tag' WHERE table_name = 'sacrifice_animals' AND column_name = 'Küpe No';
UPDATE public.change_logs SET column_name = 'barn_stall_order_no' WHERE table_name = 'sacrifice_animals' AND column_name = 'Ahır Sıra No';
UPDATE public.change_logs SET column_name = 'sacrifice_time' WHERE table_name = 'sacrifice_animals' AND column_name = 'Kesim Zamanı';
UPDATE public.change_logs SET column_name = 'slaughter_time' WHERE table_name = 'sacrifice_animals' AND column_name = 'Kesim Saati';
UPDATE public.change_logs SET column_name = 'butcher_time' WHERE table_name = 'sacrifice_animals' AND column_name = 'Parçalama Saati';
UPDATE public.change_logs SET column_name = 'delivery_time' WHERE table_name = 'sacrifice_animals' AND column_name = 'Teslimat Saati';

-- 4) shareholders kolonları
UPDATE public.change_logs SET column_name = 'shareholder_name' WHERE table_name = 'shareholders' AND column_name = 'Hissedar Adı';
UPDATE public.change_logs SET column_name = 'phone_number' WHERE table_name = 'shareholders' AND column_name = 'Telefon Numarası';
UPDATE public.change_logs SET column_name = 'second_phone_number' WHERE table_name = 'shareholders' AND column_name = 'İkinci Telefon';
UPDATE public.change_logs SET column_name = 'total_amount' WHERE table_name = 'shareholders' AND column_name = 'Toplam Tutar';
UPDATE public.change_logs SET column_name = 'paid_amount' WHERE table_name = 'shareholders' AND column_name = 'Ödenen Tutar';
UPDATE public.change_logs SET column_name = 'remaining_payment' WHERE table_name = 'shareholders' AND column_name = 'Kalan Ödeme';
UPDATE public.change_logs SET column_name = 'delivery_fee' WHERE table_name = 'shareholders' AND column_name = 'Teslimat Ücreti';
UPDATE public.change_logs SET column_name = 'delivery_location' WHERE table_name = 'shareholders' AND column_name = 'Teslimat Noktası';
UPDATE public.change_logs SET column_name = 'delivery_type' WHERE table_name = 'shareholders' AND column_name = 'Teslimat Tipi';
UPDATE public.change_logs SET column_name = 'sacrifice_consent' WHERE table_name = 'shareholders' AND column_name = 'Vekalet';
UPDATE public.change_logs SET column_name = 'notes' WHERE table_name = 'shareholders' AND column_name = 'Notlar';
UPDATE public.change_logs SET column_name = 'email' WHERE table_name = 'shareholders' AND column_name = 'E-posta';
UPDATE public.change_logs SET column_name = 'security_code' WHERE table_name = 'shareholders' AND column_name = 'Güvenlik Kodu';
UPDATE public.change_logs SET column_name = 'contacted_at' WHERE table_name = 'shareholders' AND column_name = 'Görüşüldü';

-- 5) users kolonları
UPDATE public.change_logs SET column_name = 'name' WHERE table_name = 'users' AND column_name = 'Ad';
UPDATE public.change_logs SET column_name = 'image' WHERE table_name = 'users' AND column_name = 'Profil görseli';
UPDATE public.change_logs SET column_name = 'role' WHERE table_name = 'users' AND column_name = 'Rol';
UPDATE public.change_logs SET column_name = 'email' WHERE table_name = 'users' AND column_name = 'E-posta';
UPDATE public.change_logs SET column_name = 'status' WHERE table_name = 'users' AND column_name = 'Durum';

-- 6) stage_metrics
UPDATE public.change_logs SET column_name = 'current_sacrifice_number' WHERE table_name = 'stage_metrics' AND column_name = 'Güncel kurban sırası (takip)';

-- 7) shareholders row_id: eski tetikleyici biçimi «Ad Soyad (uuid)» → yalnızca uuid (küçük harf)
--    «143» gibi sayılar sacrifice_animals / uyumsuzluk kayıtlarında sıra no olarak kalır; burada sadece
--    parantez + UUID içeren hissedar satırları düzeltilir.
UPDATE public.change_logs
SET row_id = lower(
  (regexp_match(
    row_id,
    '\(([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\)'
  ))[1]
)
WHERE table_name IN ('shareholders', 'Hissedarlar')
  AND row_id LIKE '%(%'
  AND row_id ~ '\([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\)';
