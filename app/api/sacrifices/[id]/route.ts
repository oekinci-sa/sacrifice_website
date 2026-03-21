import { authOptions } from "@/lib/auth";
import { getSessionActorEmail } from "@/lib/admin-editor-session";
import { getDefaultSacrificeYear } from "@/lib/constants/sacrifice-year";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/sacrifices/[id] - Kurbanlığı ve ilişkili kayıtları siler
 * admin / super_admin; audit: rpc_delete_sacrifice (app.actor)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "super_admin")) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const actor = getSessionActorEmail(session);
    if (!actor) {
      return NextResponse.json(
        { error: "Oturumda e-posta bulunamadı." },
        { status: 400 }
      );
    }

    const tenantId = getTenantId();
    const sacrificeYear = getDefaultSacrificeYear();
    const { id: sacrificeId } = await params;

    if (!sacrificeId) {
      return NextResponse.json(
        { error: "sacrifice_id gerekli" },
        { status: 400 }
      );
    }

    const { data: deleted, error } = await supabaseAdmin.rpc("rpc_delete_sacrifice", {
      p_actor: actor,
      p_tenant_id: tenantId,
      p_sacrifice_id: sacrificeId,
      p_sacrifice_year: sacrificeYear,
    });

    if (error) {
      console.error("rpc_delete_sacrifice", error);
      return NextResponse.json(
        { error: "Kurbanlık silinirken hata oluştu" },
        { status: 500 }
      );
    }

    if (deleted !== true) {
      return NextResponse.json(
        { error: "Kurbanlık bulunamadı veya erişim yok" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Beklenmeyen bir sunucu hatası oluştu" },
      { status: 500 }
    );
  }
}
