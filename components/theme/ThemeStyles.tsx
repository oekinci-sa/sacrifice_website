/**
 * ThemeStyles - Sunucu tarafı tema enjeksiyonu
 *
 * NEDEN: Önceki yaklaşımda ThemeProvider (client) useEffect ile /api/tenant-settings
 * çağırıyordu. Bu, ilk paint'te varsayılan shadcn temasının görünmesine, ardından
 * API yanıtı gelince tenant temasının uygulanmasına yol açıyordu (FOUC - flash).
 *
 * ÇÖZÜM: Bu Server Component, HTML ilk gönderilmeden önce tenant_settings.theme_json
 * değerini veritabanından çeker ve :root CSS değişkenleri olarak <style> tag'ine yazar.
 * Böylece tarayıcı ilk paint'te doğru tenant temasını görür; flash ortadan kalkar.
 *
 * AKIŞ:
 * 1. Middleware host'tan x-tenant-id header'ı set eder
 * 2. Bu component headers() ile tenant_id okur
 * 3. Supabase'den tenant_settings.theme_json çekilir
 * 4. CSS değişkenleri :root'a inline style olarak eklenir
 * 5. globals.css'teki varsayılanlar override edilir
 */
import { getTenantIdOptional } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { unstable_noStore } from "next/cache";

export async function ThemeStyles() {
  unstable_noStore(); // Her istekte güncel tema; cache devre dışı

  const tenantId = getTenantIdOptional();
  if (!tenantId) return null; // Middleware çalışmamışsa varsayılan tema (globals.css) kullanılır

  const { data: row } = await supabaseAdmin
    .from("tenant_settings")
    .select("theme_json")
    .eq("tenant_id", tenantId)
    .single();

  const theme = (row?.theme_json ?? {}) as Record<string, string>;
  if (Object.keys(theme).length === 0) return null;

  const cssVars = Object.entries(theme)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `--${k}: ${v};`)
    .join("\n");

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `:root { ${cssVars} }`,
      }}
    />
  );
}
