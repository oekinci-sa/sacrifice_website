import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/contact-messages/unread-count - Okunmamış mesaj sayısı
 * ?year=2025 - message_year ile filtrele
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId();
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : null;

    let query = supabaseAdmin
      .from("contact_messages")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("read_at", null);

    if (year != null && !Number.isNaN(year)) {
      query = query.eq("message_year", year);
    }

    const { count, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Sayı alınamadı" },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: count ?? 0 }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch {
    return NextResponse.json(
      { error: "Beklenmeyen hata" },
      { status: 500 }
    );
  }
}
