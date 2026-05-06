/**
 * GET /api/admin/sms/stats?year=2026&excludeTest=false
 *
 * SMS istatistiklerini döner.
 *
 * İstatistik ayrımı:
 * - Operatöre iletilen SMS: sms_sends.sent_count toplamı (Bizim SMS API kabul etti)
 * - Telefona ulaşan SMS: sms_send_recipients.dlr_status=9 sayısı (DLR onaylı)
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

    // sms_sends sorgusu
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

    const sendIds = filteredSends.map((s) => s.id as string);

    // DLR istatistikleri (sms_send_recipients)
    let dlrPhoneDelivered = 0;
    let dlrPhoneFailed = 0;
    let dlrPending = 0;

    if (sendIds.length > 0) {
      const { data: dlrData, error: dlrError } = await supabaseAdmin
        .from("sms_send_recipients")
        .select("dlr_status, dlr_completed, dlr_id")
        .in("send_id", sendIds);

      if (!dlrError && dlrData) {
        for (const r of dlrData) {
          if (r.dlr_status === 9) dlrPhoneDelivered++;
          else if (r.dlr_status === 6) dlrPhoneFailed++;
          else if (r.dlr_id && !r.dlr_completed) dlrPending++;
        }
      }
    }

    // Toplam agregat
    const totalSends = filteredSends.length;
    const totalOperatorDelivered = filteredSends.reduce(
      (sum, s) => sum + (s.sent_count ?? 0),
      0
    );
    const totalFailed = filteredSends.reduce(
      (sum, s) => sum + (s.failed_count ?? 0),
      0
    );

    // Aylık dağılım (son 6 ay)
    const now = new Date();
    const monthlyMap: Record<string, { month: string; operator_delivered: number; phone_delivered: number }> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap[key] = {
        month: d.toLocaleString("tr-TR", { month: "short", year: "numeric" }),
        operator_delivered: 0,
        phone_delivered: 0,
      };
    }

    for (const s of filteredSends) {
      const d = new Date(s.created_at as string);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap[key]) {
        monthlyMap[key].operator_delivered += s.sent_count ?? 0;
      }
    }

    // DLR başarı durumunu aylara dağıtmak için sms_send_recipients sent_at gerekir;
    // şimdilik sms_sends'in created_at'ına göre tahmin etmiyoruz — istatistik kartında
    // toplam phone_delivered gösterilir, grafik sadece operator_delivered üzerinden çalışır.

    return NextResponse.json({
      total_sends: totalSends,
      total_operator_delivered: totalOperatorDelivered,
      total_failed: totalFailed,
      dlr_phone_delivered: dlrPhoneDelivered,
      dlr_phone_failed: dlrPhoneFailed,
      dlr_pending: dlrPending,
      monthly: Object.values(monthlyMap),
    });
  } catch (e) {
    console.error("[sms/stats]", e);
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}
