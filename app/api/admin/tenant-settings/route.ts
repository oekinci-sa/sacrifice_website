import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/admin/tenant-settings - Tüm organizasyon ayarlarını listeler (sadece super_admin)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "super_admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("tenant_settings")
      .select(
        `
        *,
        tenants(name, slug)
      `
      )
      .order("tenant_id");

    if (error) {
      return NextResponse.json(
        { error: "Tenant ayarları alınamadı" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { settings: data ?? [] },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Beklenmeyen hata" },
      { status: 500 }
    );
  }
}
