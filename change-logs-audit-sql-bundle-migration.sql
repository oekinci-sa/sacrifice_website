-- =============================================================================
-- change_logs — İYİLEŞTİRME MİGRATIONU
-- Dosya: change-logs-audit-sql-bundle-migration.sql
-- Supabase SQL editöründe veya psql ile çalıştırın.
-- Sırayla uygulanabilir; her adım bağımsız.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. NULL standardı: old_value ve new_value
--    '' (boş string) ve '—' (görsel tire) → NULL
--    description ve diğer metin kolonlarına DOKUNULMAZ.
-- ---------------------------------------------------------------------------

UPDATE public.change_logs
SET old_value = NULL
WHERE old_value = '' OR old_value = '—';

UPDATE public.change_logs
SET new_value = NULL
WHERE new_value = '' OR new_value = '—';

-- ---------------------------------------------------------------------------
-- 2. change_type CHECK kısıtı
--    Trigger'lar zaten Türkçe sabit değerler üretiyor; DB seviyesinde garanti.
-- ---------------------------------------------------------------------------

ALTER TABLE public.change_logs
  DROP CONSTRAINT IF EXISTS chk_change_type;

ALTER TABLE public.change_logs
  ADD CONSTRAINT chk_change_type
  CHECK (change_type IN ('INSERT', 'UPDATE', 'DELETE'));

-- ---------------------------------------------------------------------------
-- 3. row_id indeksi (UI kayıt bazlı filtre performansı için)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_change_logs_row_id
  ON public.change_logs (tenant_id, table_name, row_id);

-- =============================================================================
-- Kontrol sorgusu (çalıştırmak zorunda değilsiniz):
-- SELECT change_type, COUNT(*) FROM change_logs GROUP BY change_type;
-- SELECT COUNT(*) FROM change_logs WHERE old_value = '' OR old_value = '—';
-- SELECT COUNT(*) FROM change_logs WHERE new_value = '' OR new_value = '—';
-- =============================================================================
