import { resolveSacrificeYearForTenant, NO_SACRIFICE_YEAR_ERROR } from "@/lib/sacrifice-year-resolver";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId();
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const sacrificeYear = await resolveSacrificeYearForTenant(tenantId, yearParam);
    const { data, error } = await supabaseAdmin
      .from("sacrifice_animals")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("sacrifice_year", sacrificeYear)
      .order("sacrifice_no", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch sacrifice animals" },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    // Return the data
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (err) {
    const message = err instanceof Error && err.message === NO_SACRIFICE_YEAR_ERROR
      ? err.message
      : "An unexpected error occurred";
    return NextResponse.json(
      { error: message },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
} 