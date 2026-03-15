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
 *
 * ELYAHAYVANCIK (Gölbaşı): rounded sıfır - site farklı görünüm için
 */
import { getTenantIdOptional } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { unstable_noStore } from "next/cache";

const TEST_TENANT_ID = "00000000-0000-0000-0000-000000000001";
const GOLBASI_TENANT_ID = "00000000-0000-0000-0000-000000000003";

export async function ThemeStyles() {
  unstable_noStore(); // Her istekte güncel tema; cache devre dışı

  const tenantId = getTenantIdOptional();
  if (!tenantId) return null; // Middleware çalışmamışsa varsayılan tema (globals.css) kullanılır
  if (tenantId === TEST_TENANT_ID) return null; // Test/Vercel: shadcn varsayılan tema

  const { data: row } = await supabaseAdmin
    .from("tenant_settings")
    .select("theme_json")
    .eq("tenant_id", tenantId)
    .single();

  const theme = (row?.theme_json ?? {}) as Record<string, string>;
  const isGolbasi = tenantId === GOLBASI_TENANT_ID;

  // Elyahayvancilik (3002): rounded sıfır - iki site farklı görünsün
  const overrides: Record<string, string> = isGolbasi ? { radius: "0" } : {};

  const mergedTheme = { ...theme, ...overrides };

  const cssVars = Object.entries(mergedTheme)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `--${k}: ${v};`)
    .join("\n");

  if (cssVars.length === 0) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `:root { ${cssVars} }`,
      }}
    />
  );
}
