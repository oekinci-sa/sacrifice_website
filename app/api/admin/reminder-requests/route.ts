import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/admin/reminder-requests - Tenant'a ait "bana haber ver" taleplerini listeler
 * ?year=2025 - sacrifice_year ile filtrele
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId();
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : null;

    let query = supabaseAdmin
      .from("reminder_requests")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (year != null && !Number.isNaN(year)) {
      query = query.eq("sacrifice_year", year);
    }

    const { data, error } = await query;

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
