import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/admin/reminder-requests - Tenant'a ait "bana haber ver" taleplerini listeler
 */
export async function GET() {
  try {
    const tenantId = getTenantId();

    const { data, error } = await supabaseAdmin
      .from("reminder_requests")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Talepler alınamadı" },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? [], {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch {
    return NextResponse.json(
      { error: "Beklenmeyen hata" },
      { status: 500 }
    );
  }
}
