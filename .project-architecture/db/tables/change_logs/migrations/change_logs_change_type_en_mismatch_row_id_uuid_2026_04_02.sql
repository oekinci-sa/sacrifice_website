-- change_type: Türkçe → İngilizce (INSERT / UPDATE / DELETE)
-- chk_change_type güncellemesi
-- mismatched_share_acknowledgments: eski row_id (sacrifice_no sayısı) → sacrifice_id metni (eşleşenler)

ALTER TABLE public.change_logs DROP CONSTRAINT IF EXISTS chk_change_type;

UPDATE public.change_logs
SET change_type = CASE change_type
  WHEN 'Ekleme' THEN 'INSERT'
  WHEN 'Güncelleme' THEN 'UPDATE'
  WHEN 'Silme' THEN 'DELETE'
  ELSE change_type
END
WHERE change_type IN ('Ekleme', 'Güncelleme', 'Silme');

UPDATE public.change_logs cl
SET row_id = sa.sacrifice_id::text
FROM public.sacrifice_animals sa
WHERE cl.table_name = 'mismatched_share_acknowledgments'
  AND cl.tenant_id = sa.tenant_id
  AND cl.sacrifice_year = sa.sacrifice_year
  AND cl.row_id ~ '^[0-9]+$'
  AND sa.sacrifice_no = cl.row_id::int;

ALTER TABLE public.change_logs
  ADD CONSTRAINT chk_change_type
  CHECK (change_type IN ('INSERT', 'UPDATE', 'DELETE'));
