/**
 * correlation_id + app.log_layer migration dosyalarını tek bundle’da birleştirir.
 * Çıktı: .project-architecture/db/tables/change_logs/migrations/change_logs_correlation_log_layer_bundle_2026_04_04.sql
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const base = path.join(root, ".project-architecture/db/tables");

const files = [
  "shareholders/functions_and_triggers/sync_empty_share_after_shareholder_delete.sql",
  "shareholders/functions_and_triggers/log_shareholder_changes.sql",
  "sacrifice_animals/functions_and_triggers/log_sacrifice_changes.sql",
  "sacrifice_animals/functions_and_triggers/rpc_update_sacrifice_core.sql",
  "shareholders/functions_and_triggers/rpc_delete_shareholder.sql",
  "shareholders/functions_and_triggers/rpc_insert_shareholders_batch.sql",
  "shareholders/functions_and_triggers/rpc_move_shareholder_to_sacrifice.sql",
];

const hdr = `-- =============================================================================
-- TEK SEFERDE UYGULANACAK BUNDLE: correlation_id + app.log_layer
-- Repo kaynakları birleştirildi (apply_order ile aynı sıra).
-- Parça dosyaları değişince: node scripts/build-change-logs-correlation-bundle.mjs
-- =============================================================================

`;

let out = hdr;
for (const f of files) {
  const p = path.join(base, f);
  out += `
-- -----------------------------------------------------------------------------
-- SOURCE: ${f}
-- -----------------------------------------------------------------------------

`;
  out += fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
  if (!out.endsWith("\n")) out += "\n";
}

const outPath = path.join(
  base,
  "change_logs/migrations/change_logs_correlation_log_layer_bundle_2026_04_04.sql"
);
fs.writeFileSync(outPath, out, "utf8");
console.log("Yazıldı:", outPath);
console.log("Satır:", out.split("\n").length, "byte:", Buffer.byteLength(out, "utf8"));
