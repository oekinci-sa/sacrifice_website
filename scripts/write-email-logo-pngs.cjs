/**
 * One-off / maintenance: logoBase64.ts içindeki PNG verisini public/ altına yazar.
 * Çalıştır: node scripts/write-email-logo-pngs.cjs
 */
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const tsPath = path.join(root, "lib", "logoBase64.ts");
const content = fs.readFileSync(tsPath, "utf8");

function extractBuffer(exportName) {
  const re = new RegExp(
    `export const ${exportName} =\\s*"data:image/png;base64,([^"]+)"`
  );
  const m = content.match(re);
  if (!m) throw new Error(`Export ${exportName} not found in logoBase64.ts`);
  return Buffer.from(m[1], "base64");
}

const out = [
  ["logoBase64Ankara", "public/logos/ankara-kurban/email-logo.png"],
  ["logoBase64Elya", "public/logos/elya-hayvancilik/email-logo.png"],
];

for (const [exportName, rel] of out) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, extractBuffer(exportName));
  console.log("Wrote", rel, `(${fs.statSync(full).size} bytes)`);
}
