import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/admin/contact-messages - Tenant'a ait iletişim mesajlarını listeler
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId();
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter"); // "all" | "read" | "unread"

    let query = supabaseAdmin
      .from("contact_messages")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (filter === "read") {
      query = query.not("read_at", "is", null);
    } else if (filter === "unread") {
      query = query.is("read_at", null);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Mesajlar alınamadı" },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? [], {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch {
    return NextResponse.json(
      { error: "Beklenmeyen hata" },
      { status: 500 }
    );
  }
}
