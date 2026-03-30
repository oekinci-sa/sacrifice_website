/**
 * Parça dosyalarını birleştirir → functions_and_triggers/log_sacrifice_changes.sql
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const base = path.join(
  root,
  ".project-architecture/db/tables/sacrifice_animals/functions_and_triggers/log_sacrifice_changes"
);
const fragDir = path.join(base, "fragments");
const outFile = path.join(
  root,
  ".project-architecture/db/tables/sacrifice_animals/functions_and_triggers/log_sacrifice_changes.sql"
);

const ORDER = [
  "01_header_insert_and_update_intro.sql",
  "02_update_no_weight_price_empty.sql",
  "02b_update_live_scale_pricing.sql",
  "03_update_notes_animal_foundation.sql",
  "04_update_times.sql",
  "05_delete_and_function_close.sql",
  "06_trigger.sql",
];

const header = `-- =============================================================================
-- BİRLEŞTİRİLMİŞ ÇIKTI — elle düzenleme yok
-- Kaynak: log_sacrifice_changes/fragments/*.sql
-- Yenileme: npm run db:merge:log-sacrifice-changes
-- =============================================================================

`;

let body = "";
for (const name of ORDER) {
  const p = path.join(fragDir, name);
  if (!fs.existsSync(p)) {
    console.error("Eksik parça:", p);
    process.exit(1);
  }
  body += fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
  if (!body.endsWith("\n")) body += "\n";
}
fs.writeFileSync(outFile, header + body, "utf8");
console.log("Yazıldı:", outFile, `(${Buffer.byteLength(header + body, "utf8")} byte)`);
