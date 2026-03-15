import { resolveSacrificeYearForTenant, NO_SACRIFICE_YEAR_ERROR } from "@/lib/sacrifice-year-resolver";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const tenantId = getTenantId();
    const sacrificeYear = await resolveSacrificeYearForTenant(tenantId, null);
    const { data, error } = await supabaseAdmin
      .from("sacrifice_animals")
      .select("empty_share")
      .eq("tenant_id", tenantId)
      .eq("sacrifice_year", sacrificeYear);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch empty shares" },
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

    // Calculate total empty shares
    const totalEmptyShares = data.reduce(
      (sum, item) => sum + (item.empty_share || 0),
      0
    );

    // Return response with cache control headers
    return NextResponse.json(
      { totalEmptyShares },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (err) {
    const message = err instanceof Error && err.message === NO_SACRIFICE_YEAR_ERROR
      ? err.message
      : "Internal server error";
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