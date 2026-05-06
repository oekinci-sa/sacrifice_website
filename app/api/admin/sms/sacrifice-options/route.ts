/**
 * GET /api/admin/sms/sacrifice-options?year=2026
 *
 * Seçili yıldaki kurbanlıkları Kurban No ile listeler (dropdown için).
 */
import { authOptions } from "@/lib/auth";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = new Set(["admin", "editor", "super_admin"]);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !ADMIN_ROLES.has(session.user.role)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const yearParam = request.nextUrl.searchParams.get("year");
    const sacrificeYear = yearParam ? parseInt(yearParam, 10) : NaN;
    if (!Number.isFinite(sacrificeYear) || sacrificeYear < 2000 || sacrificeYear > 2100) {
      return NextResponse.json(
        { error: "Geçerli bir yıl gerekli (?year=2026)" },
        { status: 400 }
      );
    }

    const tenantId = getTenantId();

    const { data, error } = await supabaseAdmin
      .from("sacrifice_animals")
      .select("sacrifice_id, sacrifice_no")
      .eq("tenant_id", tenantId)
      .eq("sacrifice_year", sacrificeYear)
      .order("sacrifice_no", { ascending: true });

    if (error) {
      console.error("[sms/sacrifice-options]", error);
      return NextResponse.json({ error: "Kurbanlık listesi alınamadı" }, { status: 500 });
    }

    const options = (data ?? []).map((r: { sacrifice_id: string; sacrifice_no: number }) => ({
      sacrifice_id: r.sacrifice_id,
      sacrifice_no: r.sacrifice_no,
    }));

    return NextResponse.json({ options }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[sms/sacrifice-options]", e);
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}
