/**
 * GET /api/admin/sms/sends/[id]
 * Belirli gönderimin detayını ve alıcılarını döner.
 */
import { authOptions } from "@/lib/auth";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = new Set(["admin", "editor", "super_admin"]);

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !ADMIN_ROLES.has(session.user.role)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const tenantId = getTenantId();

    const { data: send, error: sendError } = await supabaseAdmin
      .from("sms_sends")
      .select("*")
      .eq("id", params.id)
      .eq("tenant_id", tenantId)
      .single();

    if (sendError || !send) {
      return NextResponse.json({ error: "Gönderim bulunamadı" }, { status: 404 });
    }

    const { data: recipients, error: recError } = await supabaseAdmin
      .from("sms_send_recipients")
      .select(
        "id, recipient_name, phone_number, raw_phone_number, personalized_message, sms_parts, status, skip_reason, dlr_status, dlr_completed, error_code, sent_at, created_at, shareholder_id"
      )
      .eq("send_id", params.id)
      .order("created_at", { ascending: true });

    if (recError) {
      console.error("[sms/sends/[id]]", recError);
      return NextResponse.json({ error: "Alıcılar alınamadı" }, { status: 500 });
    }

    return NextResponse.json(
      { send, recipients: recipients ?? [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[sms/sends/[id]]", e);
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}
