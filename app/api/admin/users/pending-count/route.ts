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

    const { count: pendingCount, error: utError } = await supabaseAdmin
      .from("user_tenants")
      .select("user_id", { count: "exact" })
      .eq("tenant_id", tenantId)
      .is("approved_at", null)
      .limit(0);

    if (utError) {
      return NextResponse.json({ error: utError.message }, { status: 500 });
    }

    return NextResponse.json(
      { count: pendingCount ?? 0 },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch {
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}
