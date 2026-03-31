-- Mevcut change_logs.description → kısa sabit cümleler (tetikleyici ile aynı metinler).
-- Önce analiz: SELECT table_name, column_name, change_type, COUNT(*) FROM public.change_logs GROUP BY 1,2,3 ORDER BY 4 DESC;
-- Koşullar: İngilizce table_name / column_name (önce backfill_english_table_column_codes çalışmış olmalı).

-- sacrifice_animals — Güncelleme
UPDATE public.change_logs SET description = 'Kurban numarası güncellendi' WHERE table_name = 'sacrifice_animals' AND column_name = 'sacrifice_no' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Hisse ağırlığı güncellendi' WHERE table_name = 'sacrifice_animals' AND column_name = 'share_weight' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Hisse bedeli güncellendi' WHERE table_name = 'sacrifice_animals' AND column_name = 'share_price' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Boş hisse güncellendi' WHERE table_name = 'sacrifice_animals' AND column_name = 'empty_share' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Fiyatlama modu güncellendi' WHERE table_name = 'sacrifice_animals' AND column_name = 'pricing_mode' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Baskül ağırlığı güncellendi' WHERE table_name = 'sacrifice_animals' AND column_name = 'live_scale_total_kg' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Baskül tutarı güncellendi' WHERE table_name = 'sacrifice_animals' AND column_name = 'live_scale_total_price' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Notlar güncellendi' WHERE table_name = 'sacrifice_animals' AND column_name = 'notes' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Hayvan cinsi güncellendi' WHERE table_name = 'sacrifice_animals' AND column_name = 'animal_type' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Vakıf bilgisi güncellendi' WHERE table_name = 'sacrifice_animals' AND column_name = 'foundation' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Küpe numarası güncellendi' WHERE table_name = 'sacrifice_animals' AND column_name = 'ear_tag' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Ahır sıra numarası güncellendi' WHERE table_name = 'sacrifice_animals' AND column_name = 'barn_stall_order_no' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Kesim planı güncellendi' WHERE table_name = 'sacrifice_animals' AND column_name = 'sacrifice_time' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Kesim saati güncellendi' WHERE table_name = 'sacrifice_animals' AND column_name = 'slaughter_time' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Parçalama saati güncellendi' WHERE table_name = 'sacrifice_animals' AND column_name = 'butcher_time' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Teslimat saati güncellendi' WHERE table_name = 'sacrifice_animals' AND column_name = 'delivery_time' AND change_type = 'Güncelleme';

UPDATE public.change_logs SET description = 'Kurbanlık eklendi' WHERE table_name = 'sacrifice_animals' AND change_type = 'Ekleme';
UPDATE public.change_logs SET description = 'Kurbanlık silindi' WHERE table_name = 'sacrifice_animals' AND change_type = 'Silme';

-- shareholders
UPDATE public.change_logs SET description = 'Hissedar adı güncellendi' WHERE table_name = 'shareholders' AND column_name = 'shareholder_name' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Telefon güncellendi' WHERE table_name = 'shareholders' AND column_name = 'phone_number' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'İkinci telefon güncellendi' WHERE table_name = 'shareholders' AND column_name = 'second_phone_number' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Toplam tutar güncellendi' WHERE table_name = 'shareholders' AND column_name = 'total_amount' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Ödenen tutar güncellendi' WHERE table_name = 'shareholders' AND column_name = 'paid_amount' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Kalan ödeme güncellendi' WHERE table_name = 'shareholders' AND column_name = 'remaining_payment' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Teslimat ücreti güncellendi' WHERE table_name = 'shareholders' AND column_name = 'delivery_fee' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Teslimat noktası güncellendi' WHERE table_name = 'shareholders' AND column_name = 'delivery_location' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Teslimat tipi güncellendi' WHERE table_name = 'shareholders' AND column_name = 'delivery_type' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Vekalet durumu güncellendi' WHERE table_name = 'shareholders' AND column_name = 'sacrifice_consent' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Not güncellendi' WHERE table_name = 'shareholders' AND column_name = 'notes' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'E-posta güncellendi' WHERE table_name = 'shareholders' AND column_name = 'email' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Güvenlik kodu güncellendi' WHERE table_name = 'shareholders' AND column_name = 'security_code' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Görüşme durumu güncellendi' WHERE table_name = 'shareholders' AND column_name = 'contacted_at' AND change_type = 'Güncelleme';

UPDATE public.change_logs SET description = 'Hissedar eklendi' WHERE table_name = 'shareholders' AND change_type = 'Ekleme';
UPDATE public.change_logs SET description = 'Hissedar silindi' WHERE table_name = 'shareholders' AND change_type = 'Silme';

-- users
UPDATE public.change_logs SET description = 'Ad güncellendi' WHERE table_name = 'users' AND column_name = 'name' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Profil görseli güncellendi' WHERE table_name = 'users' AND column_name = 'image' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Rol güncellendi' WHERE table_name = 'users' AND column_name = 'role' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'E-posta güncellendi' WHERE table_name = 'users' AND column_name = 'email' AND change_type = 'Güncelleme';
UPDATE public.change_logs SET description = 'Durum güncellendi' WHERE table_name = 'users' AND column_name = 'status' AND change_type = 'Güncelleme';

UPDATE public.change_logs SET description = 'Kullanıcı eklendi' WHERE table_name = 'users' AND change_type = 'Ekleme';
UPDATE public.change_logs SET description = 'Kullanıcı silindi' WHERE table_name = 'users' AND change_type = 'Silme';

-- user_tenants (column_name genelde yok; eski uzun metin kalıplarına göre)
UPDATE public.change_logs SET description = 'Kullanıcı onaylandı' WHERE table_name = 'user_tenants' AND change_type = 'Güncelleme' AND description LIKE '%ikinci bir organizasyonda%';
UPDATE public.change_logs SET description = 'Kullanıcı onayı kaldırıldı' WHERE table_name = 'user_tenants' AND change_type = 'Güncelleme' AND description LIKE '%onaylı üye%kayıdı kaldırıldı%';

-- stage_metrics
UPDATE public.change_logs SET description = 'Sıra güncellendi' WHERE table_name = 'stage_metrics' AND column_name = 'current_sacrifice_number' AND change_type = 'Güncelleme';

-- mismatched_share_acknowledgments
UPDATE public.change_logs SET description = 'Uyumsuzluk onaylandı'
WHERE table_name = 'mismatched_share_acknowledgments' AND change_type = 'Güncelleme'
  AND (description LIKE '%uyumsuzluğu biliyorum%' OR description LIKE '%toplam hisse sayısı 7%');

UPDATE public.change_logs SET description = 'Uyumsuzluk kaldırıldı'
WHERE table_name = 'mismatched_share_acknowledgments' AND change_type = 'Güncelleme'
  AND description LIKE '%onayı kaldırıldı%';
