import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

    return NextResponse.json({ logs: data }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' } });
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
} 