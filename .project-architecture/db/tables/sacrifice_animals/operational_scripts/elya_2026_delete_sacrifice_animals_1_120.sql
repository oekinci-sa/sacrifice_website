-- Elya Hayvancılık (tenant …0003) — 2026 kurbanlık sıra no 1–120 kayıtlarını siler.
--
-- ÖN KOŞUL: Bu aralıkta hissedar kalmadığı doğrulanmalı (aksi halde CASCADE ile hissedarlar da silinir).
-- Yedek alın; geri dönüşü yok.
--
-- CASCADE etkisi (FK tanımlarına göre): bu sacrifice_id’lere bağlı
--   • shareholders
--   • reservation_transactions (sacrifice_id)
--   • mismatched_share_acknowledgments
-- satırları da silinir / temizlenir.

-- ============================================================================
-- Ön kontrol (salt okunur)
-- ============================================================================

-- Silinecek kurbanlık sayısı
/*
SELECT COUNT(*)::int AS silinecek_kurbanlik
FROM public.sacrifice_animals sa
WHERE sa.tenant_id = '00000000-0000-0000-0000-000000000003'::uuid
  AND sa.sacrifice_year = 2026
  AND sa.sacrifice_no BETWEEN 1 AND 120;
*/

-- Bu aralıkta bağlı hissedar var mı? (0 olmalı)
/*
SELECT COUNT(*)::int AS hissedar_sayisi
FROM public.shareholders sh
JOIN public.sacrifice_animals sa ON sa.sacrifice_id = sh.sacrifice_id
WHERE sh.tenant_id = '00000000-0000-0000-0000-000000000003'::uuid
  AND sh.sacrifice_year = 2026
  AND sa.sacrifice_no BETWEEN 1 AND 120;
*/

-- ============================================================================
-- SİLME
-- ============================================================================

BEGIN;

DELETE FROM public.sacrifice_animals sa
WHERE sa.tenant_id = '00000000-0000-0000-0000-000000000003'::uuid
  AND sa.sacrifice_year = 2026
  AND sa.sacrifice_no BETWEEN 1 AND 120;

-- İsteğe bağlı: kaç satır silindi (aynı oturumda)
-- GET DIAGNOSTICS silinen = ROW_COUNT;  -- psql / bazı istemcilerde

COMMIT;
