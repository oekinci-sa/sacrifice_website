/**
 * GET /api/admin/sms/sends/failed-count
 * Başarısız ve başarılı şekilde yeniden denenmemiş SMS gönderim sayısını döner.
 * ?year=2026 opsiyonel yıl filtresi.
 *
 * Bir gönderim sayılır eğer:
 * - failed_count > 0
 * - status != 'cancelled'
 * - status = 'completed' olan bir retry kaydı (target_params.retry_of = bu id) yoksa
 */
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getTenantId } from "@/lib/tenant";
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
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : null;

    // Başarısız gönderimler
    let failedQuery = supabaseAdmin
      .from("sms_sends")
      .select("id")
      .eq("tenant_id", tenantId)
      .neq("status", "cancelled")
      .gt("failed_count", 0);

    if (year != null && !Number.isNaN(year)) {
      failedQuery = failedQuery.eq("sacrifice_year", year);
    }

    const { data: failedSends, error: failedError } = await failedQuery;
    if (failedError) {
      return NextResponse.json({ error: "Sayı alınamadı" }, { status: 500 });
    }

    if (!failedSends || failedSends.length === 0) {
      return NextResponse.json({ count: 0 }, {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      });
    }

    // Başarılı retry kayıtlarını çek (target_params.retry_of dolu ve status = 'completed')
    const { data: retries, error: retryError } = await supabaseAdmin
      .from("sms_sends")
      .select("target_params")
      .eq("tenant_id", tenantId)
      .eq("status", "completed")
      .not("target_params", "is", null);

    if (retryError) {
      return NextResponse.json({ error: "Sayı alınamadı" }, { status: 500 });
    }

    // Başarılı şekilde yeniden denenen orijinal send ID'lerini topla
    const retriedIds = new Set<string>();
    for (const r of retries ?? []) {
      const tp = r.target_params as Record<string, unknown> | null;
      if (tp?.retry_of && typeof tp.retry_of === "string") {
        retriedIds.add(tp.retry_of);
      }
    }

    // Yeniden denenmeyen başarısızları say
    const count = failedSends.filter((s) => !retriedIds.has(s.id)).length;

    return NextResponse.json({ count }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch {
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}
