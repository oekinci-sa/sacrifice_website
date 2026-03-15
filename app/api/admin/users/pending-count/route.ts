import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getTenantId } from "@/lib/tenant";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/users/pending-count - Onay bekleyen kullanıcı sayısı (mevcut tenant için)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = getTenantId();

    const { data: userTenants, error: utError } = await supabaseAdmin
      .from("user_tenants")
      .select("user_id, approved_at")
      .eq("tenant_id", tenantId);

    if (utError) {
      return NextResponse.json({ error: utError.message }, { status: 500 });
    }

    const pendingCount = (userTenants ?? []).filter((ut) => ut.approved_at == null).length;

    return NextResponse.json(
      { count: pendingCount },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch {
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}
