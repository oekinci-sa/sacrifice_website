import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    console.log("[API] Fetching all change logs");

    const { data, error } = await supabaseAdmin
      .from("change_logs")
      .select("*")
      .order("changed_at", { ascending: false });

    if (error) {
      console.error("[API] Error fetching change logs:", error);
      return NextResponse.json(
        { error: "Failed to fetch change logs", details: error.message },
        { status: 500 }
      );
    }

    console.log(`[API] Successfully fetched ${data.length} change logs`);
    return NextResponse.json({ logs: data });
    
  } catch (err) {
    console.error("[API] Unexpected error fetching change logs:", err);
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
} 