import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    console.log("[API] Fetching all shareholders");

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
      console.error("[API] Error fetching shareholders:", error);
      return NextResponse.json(
        { error: "Failed to fetch shareholders", details: error.message },
        { status: 500 }
      );
    }

    console.log(`[API] Successfully fetched ${data.length} shareholders`);
    return NextResponse.json({ shareholders: data });
    
  } catch (err) {
    console.error("[API] Unexpected error fetching shareholders:", err);
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
} 