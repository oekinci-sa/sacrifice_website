import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/shareholders/[id]/contacted - Görüşüldü durumunu güncelle
 * Body: { contacted: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = getTenantId();
    const { id } = await params;
    const body = await request.json();
    const contacted = body.contacted === true;

    const { data, error } = await supabaseAdmin
      .from("shareholders")
      .update({ contacted_at: contacted ? new Date().toISOString() : null })
      .eq("shareholder_id", id)
      .eq("tenant_id", tenantId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Güncellenemedi" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Beklenmeyen hata" },
      { status: 500 }
    );
  }
}
