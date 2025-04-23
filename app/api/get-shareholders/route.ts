import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("shareholders")
      .select(`
        *,
        sacrifice:sacrifice_animals (
          sacrifice_no,
          sacrifice_time,
          share_price
        )
      `)
      .order("purchase_time", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch shareholders", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ shareholders: data }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' } });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
} 