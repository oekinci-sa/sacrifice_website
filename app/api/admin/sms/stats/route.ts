/**
 * GET /api/admin/sms/stats?year=2026&excludeTest=false
 *
 * SMS istatistiklerini döner.
 *
 * Metrikler:
 * - Operatöre iletilen SMS: sms_sends.sent_count toplamı (Bizim SMS API kabul etti)
 *
 * excludeTest=true ise target_params.is_test=true olan gönderimler hariç tutulur.
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

    const tenantId = getTenantId();
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : null;
    const excludeTest = searchParams.get("excludeTest") === "true";

    let sendsQuery = supabaseAdmin
      .from("sms_sends")
      .select("id, status, sent_count, failed_count, total_recipients, created_at, target_params")
      .eq("tenant_id", tenantId)
      .not("status", "eq", "cancelled");

    if (year) {
      sendsQuery = sendsQuery.eq("sacrifice_year", year);
    }

    const { data: sends, error: sendsError } = await sendsQuery;

    if (sendsError) {
      console.error("[sms/stats] sms_sends query error:", sendsError);
      return NextResponse.json({ error: "İstatistikler alınamadı" }, { status: 500 });
    }

    const allSends = sends ?? [];
    const filteredSends = excludeTest
      ? allSends.filter((s) => {
          const tp = s.target_params as Record<string, unknown> | null;
          return !tp?.is_test;
        })
      : allSends;

    const totalSends = filteredSends.length;
    const totalOperatorDelivered = filteredSends.reduce(
      (sum, s) => sum + (s.sent_count ?? 0),
      0
    );
    const totalFailed = filteredSends.reduce(
      (sum, s) => sum + (s.failed_count ?? 0),
      0
    );

    const now = new Date();
    const monthlyMap: Record<string, { month: string; operator_delivered: number }> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap[key] = {
        month: d.toLocaleString("tr-TR", { month: "short", year: "numeric" }),
        operator_delivered: 0,
      };
    }

    for (const s of filteredSends) {
      const d = new Date(s.created_at as string);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap[key]) {
        monthlyMap[key].operator_delivered += s.sent_count ?? 0;
      }
    }

    return NextResponse.json({
      total_sends: totalSends,
      total_operator_delivered: totalOperatorDelivered,
      total_failed: totalFailed,
      monthly: Object.values(monthlyMap),
    });
  } catch (e) {
    console.error("[sms/stats]", e);
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}
