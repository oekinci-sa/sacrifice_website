import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Extract sacrifice_id from the URL
    const url = new URL(request.url);
    const sacrificeId = url.searchParams.get("sacrifice_id");

    if (!sacrificeId) {
      return NextResponse.json(
        { error: "sacrifice_id is required" },
        { status: 400 }
      );
    }

    // Query total shareholders for the given sacrifice_id
    const { count, error } = await supabaseAdmin
      .from("shareholders")
      .select("*", { count: "exact" })
      .eq("sacrifice_id", sacrificeId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch shareholder count" },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 