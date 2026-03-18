import { authOptions } from "@/lib/auth";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/mismatched-shares
 * mismatched_shares view + acknowledgments
 * ?year=2025 - sacrifice_year ile filtrele
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "super_admin")) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const tenantId = getTenantId();
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : null;

    let query = supabaseAdmin
      .from("mismatched_shares")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("sacrifice_id", { ascending: false });

    if (year != null && !Number.isNaN(year)) {
      query = query.eq("sacrifice_year", year);
    }

    const { data: mismatched, error: viewError } = await query;

    if (viewError) {
      console.error("[mismatched-shares] View hatası:", viewError);
      return NextResponse.json(
        {
          error: "Uyumsuz hisseler alınamadı",
          ...(process.env.NODE_ENV === "development" && {
            details: viewError.message,
            code: viewError.code,
          }),
        },
        { status: 500 }
      );
    }

    const { data: acknowledgments } = await supabaseAdmin
      .from("mismatched_share_acknowledgments")
      .select("sacrifice_id, acknowledged_by, acknowledged_at")
      .eq("tenant_id", tenantId);

    const ackMap = new Map(
      (acknowledgments ?? []).map((a) => [
        a.sacrifice_id,
        { acknowledged_by: a.acknowledged_by, acknowledged_at: a.acknowledged_at },
      ])
    );

    const items = (mismatched ?? []).map((row) => {
      const ack = ackMap.get(row.sacrifice_id);
      return {
        ...row,
        acknowledged_by: ack?.acknowledged_by ?? null,
        acknowledged_at: ack?.acknowledged_at ?? null,
      };
    });

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[mismatched-shares] Beklenmeyen hata:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
