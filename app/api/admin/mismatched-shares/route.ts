import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/mismatched-shares
 * mismatched_shares view + acknowledgments
 */
export async function GET() {
  try {
    const tenantId = getTenantId();

    const { data: mismatched, error: viewError } = await supabaseAdmin
      .from("mismatched_shares")
      .select("*")
      .eq("tenant_id", tenantId);

    if (viewError) {
      return NextResponse.json(
        { error: "Uyumsuz hisseler alınamadı", details: viewError.message },
        { status: 500 }
      );
    }

    const { data: acknowledgments } = await supabaseAdmin
      .from("mismatched_share_acknowledgments")
      .select("sacrifice_id, acknowledged_by, acknowledged_at")
      .eq("tenant_id", tenantId);

    const ackMap = new Map(
      (acknowledgments ?? []).map((a) => [
        a.sacrifice_id,
        { acknowledged_by: a.acknowledged_by, acknowledged_at: a.acknowledged_at },
      ])
    );

    const items = (mismatched ?? []).map((row) => {
      const ack = ackMap.get(row.sacrifice_id);
      return {
        ...row,
        acknowledged_by: ack?.acknowledged_by ?? null,
        acknowledged_at: ack?.acknowledged_at ?? null,
      };
    });

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
