-- Migration: Sahipsiz (orphan) fonksiyonları kaldır
-- Tarih   : 2026-03-27
--
-- Aşağıdaki fonksiyonlar hiçbir trigger'a bağlı değildi;
-- daha yeni / birleşik alternatiflerine geçildiği için gereksiz kaldılar.
--
-- update_sacrifice_last_edited_time()
--   → Yerini aldı: update_last_edited_time() (reservation_transactions ile paylaşılan)
--     sacrifice_animals üzerindeki set_last_edited_time trigger'ı artık bunu kullanıyor.
--
-- update_shareholder_last_edited_time()
--   → Yerini aldı: update_last_edited_time()
--     shareholders üzerindeki set_last_edited_time trigger'ı artık bunu kullanıyor.
--
-- update_updated_at_column()
--   → Public şemadaki kopya sahipsiz; gerçek kullanan storage.update_updated_at_column().
--
-- generate_sacrifice_id()
--   → sacrifice_id artık UUID (gen_random_uuid()); sequence-based ID üretimi kaldırıldı.
--
-- generate_shareholder_id()
--   → shareholder_id artık UUID; aynı gerekçe.

DROP FUNCTION IF EXISTS public.update_sacrifice_last_edited_time();
DROP FUNCTION IF EXISTS public.update_shareholder_last_edited_time();
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.generate_sacrifice_id();
DROP FUNCTION IF EXISTS public.generate_shareholder_id();
