import { getTenantId } from "@/lib/tenant";
import { NO_SACRIFICE_YEAR_ERROR } from "@/lib/sacrifice-year-resolver";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/admin/active-year
 * Öncelik: tenant_settings.active_sacrifice_year → MAX(sacrifice_year) sacrifice_animals.
 * availableYears: tenant_settings + sacrifice_animals yıllarının birleşimi.
 */
export async function GET() {
  try {
    const tenantId = getTenantId();

    const { data: settings } = await supabaseAdmin
      .from("tenant_settings")
      .select("active_sacrifice_year")
      .eq("tenant_id", tenantId)
      .single();

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

    const yearsFromSacrifices = Array.from(
      new Set((yearsData ?? []).map((r) => r.sacrifice_year))
    ).sort((a, b) => b - a);
    const maxYearFromSacrifices = yearsFromSacrifices[0];

    const tenantYear = settings?.active_sacrifice_year ?? null;
    const activeYear =
      tenantYear ?? maxYearFromSacrifices ?? null;

    if (activeYear == null) {
      return NextResponse.json({ error: NO_SACRIFICE_YEAR_ERROR }, { status: 500 });
    }

    const availableYears = Array.from(
      new Set([...(tenantYear != null ? [tenantYear] : []), ...yearsFromSacrifices])
    ).sort((a, b) => b - a);

    return NextResponse.json({
      activeYear,
      availableYears: availableYears.length > 0 ? availableYears : [activeYear],
    });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
