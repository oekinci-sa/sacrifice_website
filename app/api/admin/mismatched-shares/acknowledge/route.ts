import { authOptions } from "@/lib/auth";
import { getSessionActorEmail } from "@/lib/admin-editor-session";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/mismatched-shares/acknowledge
 * Body: { sacrifice_id: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const allowedRoles = ["admin", "editor", "super_admin"];
    if (!session?.user || !allowedRoles.includes(session.user.role ?? "")) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const actor = getSessionActorEmail(session);
    if (!actor) {
      return NextResponse.json(
        { error: "Oturumda e-posta bulunamadı." },
        { status: 400 }
      );
    }

    const tenantId = getTenantId();
    const body = await request.json();
    const sacrifice_id = body?.sacrifice_id;

    if (!sacrifice_id || typeof sacrifice_id !== "string") {
      return NextResponse.json(
        { error: "sacrifice_id gerekli" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.rpc("rpc_acknowledge_mismatch", {
      p_actor: actor,
      p_tenant_id: tenantId,
      p_sacrifice_id: sacrifice_id,
    });

    if (error) {
      const msg = error.message ?? "";
      if (msg.includes("sacrifice_not_found")) {
        return NextResponse.json({ error: "Kurban kaydı bulunamadı." }, { status: 404 });
      }
      console.error("rpc_acknowledge_mismatch", error);
      return NextResponse.json(
        { error: "Farkındalık kaydedilemedi" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
