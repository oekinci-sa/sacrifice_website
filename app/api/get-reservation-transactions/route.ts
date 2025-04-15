import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    console.log("[API] Fetching all reservation transactions");

    const { data, error } = await supabaseAdmin
      .from("reservation_transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[API] Error fetching reservation transactions:", error);
      return NextResponse.json(
        { error: "Failed to fetch reservation transactions", details: error.message },
        { status: 500 }
      );
    }

    console.log(`[API] Successfully fetched ${data.length} reservation transactions`);
    return NextResponse.json({ transactions: data });
    
  } catch (err) {
    console.error("[API] Unexpected error fetching reservation transactions:", err);
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
} 