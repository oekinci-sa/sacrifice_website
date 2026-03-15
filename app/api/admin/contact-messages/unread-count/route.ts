import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/contact-messages/unread-count - Okunmamış mesaj sayısı
 */
export async function GET() {
  try {
    const tenantId = getTenantId();

    const { count, error } = await supabaseAdmin
      .from("contact_messages")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("read_at", null);

    if (error) {
      return NextResponse.json(
        { error: "Sayı alınamadı" },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: count ?? 0 }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch {
    return NextResponse.json(
      { error: "Beklenmeyen hata" },
      { status: 500 }
    );
  }
}
