-- Referans (foundation): serbest metin + "Referans: …" notlarından taşıma
-- Çalıştırmadan önce yedek alın.
--
-- 1) Eski CHECK kuralını kaldırır (yalnızca AKV/İMH/AGD zorunluluğu kalkar).
-- 2) notes alanı 'Referans:' ile başlayan satırlarda metni foundation'a taşır, notes'u temizler.
--
-- İsteğe bağlı filtre: tüm tenant/yıllar için çalıştırmak için WHERE koşulunu kaldırın veya genişletin.

BEGIN;

-- --- 1) Şema: foundation için üçlü kod kısıtını kaldır ---
ALTER TABLE public.sacrifice_animals
  DROP CONSTRAINT IF EXISTS sacrifice_animals_foundation_check;

-- --- 2) Veri: "Referans: …" → foundation, notes boş ---
UPDATE public.sacrifice_animals sa
SET
  foundation = NULLIF(TRIM(regexp_replace(sa.notes, '^\s*Referans:\s*', '', 'i')), ''),
  notes = NULL,
  last_edited_by = COALESCE(sa.last_edited_by, 'SQL migrate referans'),
  last_edited_time = now()
WHERE sa.notes IS NOT NULL
  AND sa.notes ~ '^\s*Referans:\s*\S'
  -- Aşağıdaki satırları kaldırırsanız tüm kurbanlıklarda aynı dönüşüm yapılır:
  AND sa.tenant_id = '00000000-0000-0000-0000-000000000003'::uuid
  AND sa.sacrifice_year = 2026
  AND sa.sacrifice_no BETWEEN 1001 AND 1180;

COMMIT;

-- Doğrulama örnekleri (isteğe bağlı çalıştırın):
-- SELECT sacrifice_no, foundation, notes
-- FROM public.sacrifice_animals
-- WHERE tenant_id = '00000000-0000-0000-0000-000000000003'::uuid
--   AND sacrifice_year = 2026
--   AND sacrifice_no BETWEEN 1001 AND 1180
-- ORDER BY sacrifice_no;
