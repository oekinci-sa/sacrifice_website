import {
  resolveSacrificeYearForTenant,
  NO_SACRIFICE_YEAR_ERROR,
} from "@/lib/sacrifice-year-resolver";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Sacrifice ID is required" },
        {
          status: 400,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    const yearParam = searchParams.get("year");
    const sacrificeYear = await resolveSacrificeYearForTenant(tenantId, yearParam);

    // Use the supabaseAdmin client with service role to fetch data
    const { data, error } = await supabaseAdmin
      .from("sacrifice_animals")
      .select("empty_share")
      .eq("tenant_id", tenantId)
      .eq("sacrifice_id", id)
      .eq("sacrifice_year", sacrificeYear)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch sacrifice empty_share" },
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
    const message =
      err instanceof Error && err.message === NO_SACRIFICE_YEAR_ERROR
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