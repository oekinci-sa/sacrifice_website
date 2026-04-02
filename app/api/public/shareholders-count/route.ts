import { getTenantIdFromHeaders } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/public/shareholders-count?year=2026
 * Satış grafikleri / genel bakış ile aynı tanım: seçili yıldaki hissedar kayıt sayısı.
 *
 * NOT: head:true kullanmıyoruz — Vercel production'da PostgREST HEAD isteği
 * yanlış count döndürebiliyor. Bunun yerine limit(0) ile veri çekmeden
 * sadece Content-Range header'ındaki exact count'u alıyoruz.
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromHeaders(request.headers);
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : null;

    let query = supabaseAdmin
      .from("shareholders")
      .select("shareholder_id", { count: "exact" })
      .eq("tenant_id", tenantId);

    if (year != null && !Number.isNaN(year)) {
      query = query.eq("sacrifice_year", year);
    }

    const { count, error } = await query.limit(0);

    if (error) {
      return NextResponse.json({ error: "Sayım alınamadı" }, { status: 500 });
    }

    return NextResponse.json(
      { count: count ?? 0 },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch {
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}
