/**
 * GET /api/admin/sms/sends
 * Gönderim geçmişini döner (son 100 kayıt, yıl bazlı filtre opsiyonel).
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

    const sp = request.nextUrl.searchParams;
    const yearParam = sp.get("year");
    const sacrificeYear = yearParam ? parseInt(yearParam, 10) : NaN;
    const statusFilter = sp.get("status");
    const tenantId = getTenantId();

    let query = supabaseAdmin
      .from("sms_sends")
      .select(
        "id, title, message_content, target_type, status, total_recipients, sent_count, failed_count, excluded_count, estimated_total_sms_parts, deduplicate_phone_numbers, sacrifice_year, created_by, created_at, completed_at, template_id"
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (Number.isFinite(sacrificeYear)) {
      query = query.eq("sacrifice_year", sacrificeYear);
    }
    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[sms/sends GET]", error);
      return NextResponse.json({ error: "Gönderim geçmişi alınamadı" }, { status: 500 });
    }

    return NextResponse.json(
      { sends: data ?? [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[sms/sends GET]", e);
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}
