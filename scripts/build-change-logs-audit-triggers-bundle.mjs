import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const files = [
  "sacrifice_animals/functions_and_triggers/log_sacrifice_changes.sql",
  "shareholders/functions_and_triggers/log_shareholder_changes.sql",
  "users/functions_and_triggers/log_user_changes.sql",
  "user_tenants/functions_and_triggers/log_user_tenants_changes.sql",
  "stage_metrics/functions_and_triggers/log_stage_metrics_changes.sql",
  "mismatched_share_acknowledgments/functions_and_triggers/log_mismatch_changes.sql",
].map((rel) =>
  path.join(root, ".project-architecture/db/tables", rel),
);

const header = `-- =============================================================================
-- change_logs — AUDIT TETİKLEYİCİLERİ (tek seferde uygula)
-- Dosya: change-logs-audit-triggers-bundle.sql
-- Yenileme: node scripts/build-change-logs-audit-triggers-bundle.mjs
-- Kaynak: .project-architecture/db/tables/*/functions_and_triggers/log_*_changes.sql
--
-- Ne yapar: 6 fonksiyon CREATE OR REPLACE + ilgili DROP/CREATE TRIGGER
-- Sıra: sacrifice_animals → shareholders → users → user_tenants → stage_metrics → mismatched
--
-- Opsiyonel (şema/veri): change-logs-audit-sql-bundle-migration.sql (NULL, CHECK, index)
-- Opsiyonel (eski satırların description): .project-architecture/db/tables/change_logs/migrations/backfill_short_descriptions_2026_04.sql
-- =============================================================================

`;

const parts = files.map((f) => fs.readFileSync(f, "utf8"));
const out = path.join(root, "change-logs-audit-triggers-bundle.sql");
fs.writeFileSync(out, header + parts.join("\n\n"), "utf8");
console.log("Wrote", out, "(" + fs.statSync(out).size + " bytes)");
