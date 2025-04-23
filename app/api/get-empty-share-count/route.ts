import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // Query total empty shares
    const { data, error } = await supabaseAdmin
      .from("sacrifice_animals")
      .select("empty_share");

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
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
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