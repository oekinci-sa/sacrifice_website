import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("change_logs")
      .select("*")
      .order("changed_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch change logs", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ logs: data });
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
} 