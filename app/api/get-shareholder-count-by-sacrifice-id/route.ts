import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from "next/server";

// Mark this route as dynamic since it uses request.url
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Extract sacrifice_id from the URL
    const url = new URL(request.url);
    const sacrifice_id = url.searchParams.get("sacrifice_id");

    if (!sacrifice_id) {
      return NextResponse.json(
        { error: "sacrifice_id is required" },
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

    // Query total shareholders for the given sacrifice_id
    const { count, error } = await supabaseAdmin
      .from("shareholders")
      .select("*", { count: "exact" })
      .eq("sacrifice_id", sacrifice_id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch shareholder count" },
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

    return NextResponse.json({ count: count || 0 }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
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