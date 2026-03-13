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
      .select("theme_json")
      .eq("tenant_id", tenantId)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Tenant ayarları alınamadı" },
        { status: 500 }
      );
    }

    const theme = data?.theme_json ?? {};
    return NextResponse.json({ theme }, {
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
