import { getDefaultSacrificeYear } from '@/lib/constants/sacrifice-year';
import { getTenantId } from '@/lib/tenant';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantId();
    const sacrificeYear = getDefaultSacrificeYear();
    const { sacrificeId, emptyShare } = await request.json();

    // Validate input
    if (!sacrificeId) {
      return NextResponse.json(
        { error: "sacrifice_id is required" },
        { status: 400 }
      );
    }

    if (typeof emptyShare !== 'number') {
      return NextResponse.json(
        { error: "empty_share must be a number" },
        { status: 400 }
      );
    }

    // Use the supabaseAdmin client with service role to update data
    const { data, error } = await supabaseAdmin
      .from("sacrifice_animals")
      .update({ empty_share: emptyShare })
      .eq("tenant_id", tenantId)
      .eq("sacrifice_id", sacrificeId)
      .eq("sacrifice_year", sacrificeYear)
      .select();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update sacrifice animal" },
        { status: 500 }
      );
    }

    // Return the updated data
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 