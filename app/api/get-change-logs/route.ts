import { getTenantId } from "@/lib/tenant";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const tenantId = getTenantId();
    const { data, error } = await supabaseAdmin
      .from("change_logs")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("changed_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch change logs" },
        { status: 500 }
      );
    }

    return NextResponse.json({ logs: data }, {
      headers: { 
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 