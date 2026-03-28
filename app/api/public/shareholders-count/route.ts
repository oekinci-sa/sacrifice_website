import { getTenantIdFromHeaders } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/public/shareholders-count?year=2026
 * Satış grafikleri / genel bakış ile aynı tanım: seçili yıldaki hissedar kayıt sayısı.
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromHeaders(request.headers);
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : null;

    let query = supabaseAdmin
      .from("shareholders")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    if (year != null && !Number.isNaN(year)) {
      query = query.eq("sacrifice_year", year);
    }

    const { count, error, status, statusText } = await query;

    // --- TEMP DEBUG: production count mismatch diagnosis ---
    const debugPayload: Record<string, unknown> = {
      tenantId,
      yearParam,
      yearParsed: year,
      yearType: typeof year,
      count,
      error: error ? { message: error.message, code: error.code, details: error.details, hint: error.hint } : null,
      pgStatus: status,
      pgStatusText: statusText,
      requestUrl: request.url,
      host: request.headers.get("host"),
      xForwardedHost: request.headers.get("x-forwarded-host"),
      xTenantId: request.headers.get("x-tenant-id"),
    };

    if (year != null && !Number.isNaN(year)) {
      const { count: rawCount, error: rawError } = await supabaseAdmin
        .from("shareholders")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("sacrifice_year", year);
      debugPayload.rawCountRecheck = rawCount;
      debugPayload.rawCountRecheckError = rawError
        ? { message: rawError.message, code: rawError.code }
        : null;

      const { data: idRows, error: idError } = await supabaseAdmin
        .from("shareholders")
        .select("shareholder_id")
        .eq("tenant_id", tenantId)
        .eq("sacrifice_year", year)
        .limit(1000);
      debugPayload.idRowsLength = idRows?.length ?? null;
      debugPayload.idError = idError
        ? { message: idError.message, code: idError.code }
        : null;

      const { count: noHeadCount, error: noHeadError } = await supabaseAdmin
        .from("shareholders")
        .select("shareholder_id", { count: "exact" })
        .eq("tenant_id", tenantId)
        .eq("sacrifice_year", year)
        .limit(1);
      debugPayload.noHeadCount = noHeadCount;
      debugPayload.noHeadError = noHeadError
        ? { message: noHeadError.message, code: noHeadError.code }
        : null;
    }

    console.log("[shareholders-count DEBUG]", JSON.stringify(debugPayload));
    // --- END TEMP DEBUG ---

    if (error) {
      return NextResponse.json({ error: "Sayım alınamadı" }, { status: 500 });
    }

    return NextResponse.json(
      { count: count ?? 0, _debug: debugPayload },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (e) {
    console.error("[shareholders-count ERROR]", e);
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}
