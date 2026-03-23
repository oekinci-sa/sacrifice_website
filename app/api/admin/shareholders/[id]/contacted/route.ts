import { authOptions } from "@/lib/auth";
import {
  getSessionActorEmail,
  sessionHasAdminEditorOrSuperRole,
} from "@/lib/admin-editor-session";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
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
    const session = await getServerSession(authOptions);
    if (!sessionHasAdminEditorOrSuperRole(session)) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const actor = getSessionActorEmail(session);
    if (!actor) {
      return NextResponse.json(
        { error: "Oturumda e-posta bulunamadı." },
        { status: 400 }
      );
    }

    const tenantId = getTenantId();
    const { id } = await params;
    const body = await request.json();
    const contacted = body.contacted === true;
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin.rpc("rpc_update_shareholder", {
      p_actor: actor,
      p_tenant_id: tenantId,
      p_shareholder_id: id,
      p_patch: {
        contacted_at: contacted ? now : null,
        last_edited_by: actor,
        last_edited_time: now,
      },
    });

    if (error) {
      return NextResponse.json(
        { error: "Güncellenemedi" },
        { status: 500 }
      );
    }

    const rows = data as unknown[] | null;
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json(
      { error: "Beklenmeyen hata" },
      { status: 500 }
    );
  }
}
