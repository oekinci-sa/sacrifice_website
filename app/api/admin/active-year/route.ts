import { getTenantId } from "@/lib/tenant";
import { NO_SACRIFICE_YEAR_ERROR } from "@/lib/sacrifice-year-resolver";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/admin/active-year
 * Tenant için en son yıl (MAX(sacrifice_year)) döner.
 * Veri yoksa tenant_settings.active_sacrifice_year.
 * İkisi de yoksa 500 hata (fallback yok).
 */
export async function GET() {
  try {
    const tenantId = getTenantId();

    const { data: yearsData, error } = await supabaseAdmin
      .from("sacrifice_animals")
      .select("sacrifice_year")
      .eq("tenant_id", tenantId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch active year" },
        { status: 500 }
      );
    }

    const uniqueYears = Array.from(new Set((yearsData ?? []).map((r) => r.sacrifice_year))).sort(
      (a, b) => b - a
    );
    const maxYear = uniqueYears[0];

    if (maxYear != null) {
      const availableYears = uniqueYears.length > 0 ? uniqueYears : [maxYear];
      return NextResponse.json({ activeYear: maxYear, availableYears });
    }

    const { data: settings } = await supabaseAdmin
      .from("tenant_settings")
      .select("active_sacrifice_year")
      .eq("tenant_id", tenantId)
      .single();

    const activeYear = settings?.active_sacrifice_year;
    if (activeYear == null) {
      return NextResponse.json({ error: NO_SACRIFICE_YEAR_ERROR }, { status: 500 });
    }

    return NextResponse.json({ activeYear, availableYears: [activeYear] });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
