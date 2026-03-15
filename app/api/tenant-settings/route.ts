import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/tenant-settings - Tenant tema ayarlarını döner (theme_json)
 * CSS değişkenleri için kullanılır: --primary, --secondary, --primary-dark vb.
 */
export async function GET() {
  try {
    const tenantId = getTenantId();

    const { data, error } = await supabaseAdmin
      .from("tenant_settings")
      .select("theme_json, homepage_mode, homepage_layout, logo_slug, iban, website_url, contact_phone, contact_email, contact_address")
      .eq("tenant_id", tenantId)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Tenant ayarları alınamadı" },
        { status: 500 }
      );
    }

    const theme = data?.theme_json ?? {};
    const homepageMode = data?.homepage_mode ?? "thanks";
    const homepageLayout = data?.homepage_layout ?? "default";
    const branding = {
      tenant_id: tenantId,
      logo_slug: data?.logo_slug ?? "ankara-kurban",
      iban: data?.iban ?? "Kapora için IBAN bilgisi daha sonra sizlerle paylaşılacaktır.",
      website_url: data?.website_url ?? "ankarakurban.com.tr",
      contact_phone: data?.contact_phone ?? "0312 312 44 64 / 0552 652 90 00",
      contact_email: data?.contact_email ?? "iletisim@ankarakurban.com.tr",
      contact_address: data?.contact_address ?? "Hacı Bayram, Ulus, Adliye Sk. No:1 Altındağ/Ankara (09.00 - 18.00)",
    };
    return NextResponse.json({ theme, homepage_mode: homepageMode, homepage_layout: homepageLayout, branding }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
