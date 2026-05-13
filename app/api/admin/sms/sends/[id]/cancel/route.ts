/**
 * POST /api/admin/sms/sends/[id]/cancel
 *
 * Yalnızca `draft` statüsündeki gönderimler iptal edilebilir (`admin` | `editor` | `super_admin`).
 * completed / partial_fail / failed durumlarında 400 döner.
 */
import { authOptions } from "@/lib/auth";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["admin", "editor", "super_admin"]);

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !ALLOWED_ROLES.has(session.user.role)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const tenantId = getTenantId();
    const sendId = params.id;

    const { data: send, error: fetchError } = await supabaseAdmin
      .from("sms_sends")
      .select("id, status, title")
      .eq("id", sendId)
      .eq("tenant_id", tenantId)
      .single();

    if (fetchError || !send) {
      return NextResponse.json({ error: "Gönderim bulunamadı" }, { status: 404 });
    }

    if (send.status !== "draft") {
      return NextResponse.json(
        {
          error: `Bu gönderim iptal edilemez. Yalnızca 'Taslak' durumundaki gönderimler iptal edilebilir. Mevcut durum: ${send.status}`,
        },
        { status: 400 }
      );
    }

    // sms_sends → cancelled
    await supabaseAdmin
      .from("sms_sends")
      .update({ status: "cancelled" })
      .eq("id", sendId);

    // queued alıcılar → skipped
    await supabaseAdmin
      .from("sms_send_recipients")
      .update({ status: "skipped", skip_reason: "cancelled" })
      .eq("send_id", sendId)
      .eq("status", "queued");

    return NextResponse.json({ ok: true, sendId });
  } catch (e) {
    console.error("[sms/sends/cancel]", e);
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}
