import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const parts = [
  `-- =============================================================================
-- TEK SEFERDE ÇALIŞTIR (Supabase SQL Editor / psql)
-- Dosya: supabase-single-run-change-logs-extras-planned-delivery.sql
-- Yenileme: node scripts/build-supabase-single-run-extras.mjs
--
-- İçerik:
--  A) change_logs: NULL standardı + change_type CHECK + row_id indeksi
--  B) sacrifice_animals.planned_delivery_time: GENERATED → düzenlenebilir TIME + INSERT tetikleyici
--  C) rpc_update_sacrifice_core (planlı teslim + kesimde +90 dk senkron)
--  D) log_sacrifice_changes + trigger (planned_delivery_time denetim kaydı)
--
-- Önkoşul: Henüz çalıştırmadıysanız önce change-logs-audit-triggers-bundle.sql (audit tetikleyiciler).
-- Bu betikteki (D) bölümü log_sacrifice_changes'i günceller; tetikleyiciler eskiyse birlikte uygulayın.
-- =============================================================================

`,

  fs.readFileSync(path.join(root, "change-logs-audit-sql-bundle-migration.sql"), "utf8"),

  `

-- =============================================================================
-- B) planned_delivery_time: artık GENERATED değil; düzenlenebilir TIME
-- =============================================================================

ALTER TABLE public.sacrifice_animals
  DROP COLUMN IF EXISTS planned_delivery_time;

ALTER TABLE public.sacrifice_animals
  ADD COLUMN planned_delivery_time TIME;

UPDATE public.sacrifice_animals
SET planned_delivery_time = (sacrifice_time + interval '90 minutes')::time
WHERE planned_delivery_time IS NULL;

ALTER TABLE public.sacrifice_animals
  ALTER COLUMN planned_delivery_time SET NOT NULL;

CREATE OR REPLACE FUNCTION public.set_planned_delivery_time_on_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $tr$
BEGIN
  IF NEW.planned_delivery_time IS NULL THEN
    NEW.planned_delivery_time := (NEW.sacrifice_time + interval '90 minutes')::time;
  END IF;
  RETURN NEW;
END;
$tr$;

DROP TRIGGER IF EXISTS trg_sacrifice_animals_planned_delivery_bi ON public.sacrifice_animals;

CREATE TRIGGER trg_sacrifice_animals_planned_delivery_bi
  BEFORE INSERT ON public.sacrifice_animals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_planned_delivery_time_on_insert();

`,

  fs.readFileSync(
    path.join(
      root,
      ".project-architecture/db/tables/sacrifice_animals/functions_and_triggers/rpc_update_sacrifice_core.sql",
    ),
    "utf8",
  ),

  "\n\n",

  fs.readFileSync(
    path.join(
      root,
      ".project-architecture/db/tables/sacrifice_animals/functions_and_triggers/log_sacrifice_changes.sql",
    ),
    "utf8",
  ),
];

const out = path.join(root, "supabase-single-run-change-logs-extras-planned-delivery.sql");
fs.writeFileSync(out, parts.join(""), "utf8");
console.log("Wrote", out, "(" + fs.statSync(out).size + " bytes)");
