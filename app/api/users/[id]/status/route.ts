import { authOptions } from "@/lib/auth";
import { getSessionActorEmail } from "@/lib/admin-editor-session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getTenantId } from "@/lib/tenant";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

interface RouteParams {
  params: { id: string };
}

const KAHRAMANKAZAN_ID = "00000000-0000-0000-0000-000000000002";
const GOLBASI_ID = "00000000-0000-0000-0000-000000000003";

function getOtherTenantId(currentTenantId: string): string {
  return currentTenantId === GOLBASI_ID ? KAHRAMANKAZAN_ID : GOLBASI_ID;
}

// PATCH /api/users/[id]/status - Update user status (sadece tenant'ta erişimi varsa)
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    const canManage = session?.user?.role === "admin" || session?.user?.role === "super_admin";
    if (!session || !session.user || !canManage) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const actor = getSessionActorEmail(session);
    if (!actor) {
      return NextResponse.json(
        { error: "Oturumda e-posta bulunamadı." },
        { status: 400 }
      );
    }

    const { id } = params;
    const tenantId = getTenantId();
    const body = await request.json();
    const { status, addToOtherTenant, revokeApproval } = body;

    if (addToOtherTenant && session.user.role !== "super_admin") {
      return NextResponse.json(
        { error: "Bu işlem sadece super admin tarafından yapılabilir." },
        { status: 403 }
      );
    }

    if (revokeApproval) {
      const { data: rows, error } = await supabaseAdmin.rpc("rpc_patch_user_tenant_status", {
        p_actor: actor,
        p_tenant_id: tenantId,
        p_user_id: id,
        p_revoke_approval: true,
        p_status: null,
        p_other_tenant_id: null,
      });

      if (error) {
        const msg = error.message ?? "";
        if (msg.includes("user_tenant_not_found")) {
          return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
        }
        console.error("rpc_patch_user_tenant_status (revoke)", error);
        return NextResponse.json({ error: "İşlem başarısız" }, { status: 500 });
      }

      const list = rows as Record<string, unknown>[] | null;
      const u = list?.[0];
      if (!u) {
        return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
      }
      return NextResponse.json(u);
    }

    if (!status || !["pending", "approved", "blacklisted"].includes(status)) {
      return NextResponse.json({ error: "Geçersiz durum değeri" }, { status: 400 });
    }

    const otherId = addToOtherTenant ? getOtherTenantId(tenantId) : null;

    const { data: rows, error } = await supabaseAdmin.rpc("rpc_patch_user_tenant_status", {
      p_actor: actor,
      p_tenant_id: tenantId,
      p_user_id: id,
      p_revoke_approval: false,
      p_status: status,
      p_other_tenant_id: otherId,
    });

    if (error) {
      const msg = error.message ?? "";
      if (msg.includes("user_tenant_not_found") || msg.includes("user_not_found")) {
        return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
      }
      console.error("rpc_patch_user_tenant_status", error);
      return NextResponse.json({ error: error.message || "İşlem başarısız" }, { status: 500 });
    }

    const list = rows as Record<string, unknown>[] | null;
    const row = list?.[0];
    if (!row) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
