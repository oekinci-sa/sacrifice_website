import { getTenantIdFromHeaders } from "@/lib/tenant";
import { NO_SACRIFICE_YEAR_ERROR } from "@/lib/sacrifice-year-resolver";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/public/active-year
 * Public sayfalar için tenant'a özgü yıl.
 * 1. ?year=2025 varsa onu kullan
 * 2. tenant_settings.active_sacrifice_year
 * 3. sacrifice_animals MAX(sacrifice_year)
 * Yıl bulunamazsa 500 döner (fallback yok).
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromHeaders(request.headers);
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");

    const requestedYear = yearParam && !Number.isNaN(parseInt(yearParam, 10))
      ? parseInt(yearParam, 10)
      : null;

    if (requestedYear != null) {
      const { data: yearsData } = await supabaseAdmin
        .from("sacrifice_animals")
        .select("sacrifice_year")
        .eq("tenant_id", tenantId);
      const uniqueYears = Array.from(new Set((yearsData ?? []).map((r) => r.sacrifice_year))).sort(
        (a, b) => b - a
      );
      const availableYears = uniqueYears.length > 0 ? uniqueYears : [requestedYear];
      return NextResponse.json({ year: requestedYear, availableYears });
    }

    const { data: settings } = await supabaseAdmin
      .from("tenant_settings")
      .select("active_sacrifice_year")
      .eq("tenant_id", tenantId)
      .single();

    if (settings?.active_sacrifice_year != null) {
      const { data: yearsData } = await supabaseAdmin
        .from("sacrifice_animals")
        .select("sacrifice_year")
        .eq("tenant_id", tenantId);
      const uniqueYears = Array.from(new Set((yearsData ?? []).map((r) => r.sacrifice_year))).sort(
        (a, b) => b - a
      );
      const availableYears = uniqueYears.length > 0 ? uniqueYears : [settings.active_sacrifice_year];
      return NextResponse.json({ year: settings.active_sacrifice_year, availableYears });
    }

    const { data: yearsData } = await supabaseAdmin
      .from("sacrifice_animals")
      .select("sacrifice_year")
      .eq("tenant_id", tenantId);
    const uniqueYears = Array.from(new Set((yearsData ?? []).map((r) => r.sacrifice_year))).sort(
      (a, b) => b - a
    );
    const latestYear = uniqueYears[0];
    if (latestYear == null) {
      return NextResponse.json({ error: NO_SACRIFICE_YEAR_ERROR }, { status: 500 });
    }

    const availableYears = uniqueYears.length > 0 ? uniqueYears : [latestYear];
    return NextResponse.json({ year: latestYear, availableYears });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
