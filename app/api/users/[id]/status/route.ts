import { authOptions } from "@/lib/auth";
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

    // Check authorization
    const canManage = session?.user?.role === "admin" || session?.user?.role === "super_admin";
    if (!session || !session.user || !canManage) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const tenantId = getTenantId();
    const body = await request.json();
    const { status, addToOtherTenant, revokeApproval } = body;

    // "Onayla ve diğer siteye de ekle" sadece super_admin için
    if (addToOtherTenant && session.user.role !== "super_admin") {
      return NextResponse.json({ error: "Bu işlem sadece super admin tarafından yapılabilir." }, { status: 403 });
    }

    const { data: ut } = await supabaseAdmin
      .from("user_tenants")
      .select("user_id")
      .eq("user_id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (!ut) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Onayı kaldır: user_tenants.approved_at = null
    if (revokeApproval) {
      await supabaseAdmin
        .from("user_tenants")
        .update({ approved_at: null })
        .eq("user_id", id)
        .eq("tenant_id", tenantId);
      const { data: u } = await supabaseAdmin.from("users").select("*").eq("id", id).single();
      return NextResponse.json(u);
    }

    if (!status || !["pending", "approved", "blacklisted"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const { data, error: _error } = await supabaseAdmin
      .from("users")
      .update({ status })
      .eq("id", id)
      .select();

    if (_error) {
      return NextResponse.json({ error: _error.message }, { status: 500 });
    }

    // Onay: user_tenants.approved_at güncelle (per-tenant onay)
    if (status === "approved") {
      await supabaseAdmin
        .from("user_tenants")
        .update({ approved_at: new Date().toISOString() })
        .eq("user_id", id)
        .eq("tenant_id", tenantId);

      // "Diğer siteye de ekle" seçildiyse: diğer tenant'a pre-approved ekle (sadece super_admin)
      if (addToOtherTenant) {
        const otherTenantId = getOtherTenantId(tenantId);
        await supabaseAdmin.from("user_tenants").upsert(
          {
            user_id: id,
            tenant_id: otherTenantId,
            approved_at: new Date().toISOString(),
          },
          { onConflict: "user_id,tenant_id" }
        );
      }
    }

    return NextResponse.json(data[0]);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 