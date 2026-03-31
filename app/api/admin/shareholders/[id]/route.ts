import { buildEmailToEditorDisplayMap, editorDisplayFromRaw } from "@/lib/resolve-editor-display";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/shareholders/[id] - Tek hissedar getir (realtime için)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = getTenantId();
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("shareholders")
      .select(`
        *,
        sacrifice:sacrifice_animals (
          sacrifice_id,
          sacrifice_no,
          sacrifice_time,
          planned_delivery_time,
          share_price,
          share_weight,
          pricing_mode,
          live_scale_total_kg,
          live_scale_total_price
        )
      `)
      .eq("shareholder_id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Hissedar bulunamadı" }, { status: 404 });
    }

    const displayMap = await buildEmailToEditorDisplayMap(supabaseAdmin, [
      data.last_edited_by as string | null,
    ]);
    return NextResponse.json({
      ...data,
      last_edited_by_display: editorDisplayFromRaw(
        data.last_edited_by as string | null,
        displayMap
      ),
    });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
