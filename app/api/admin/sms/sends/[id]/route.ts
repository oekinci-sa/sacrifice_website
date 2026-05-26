/**
 * GET /api/admin/sms/sends/[id] — detay + alıcılar (admin | editor | super_admin)
 * DELETE /api/admin/sms/sends/[id] — kaydı kalıcı siler (**yalnızca super_admin**); alıcılar CASCADE
 */
import { authOptions } from "@/lib/auth";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  buildEmailToEditorDisplayMap,
  editorDisplayFromRaw,
} from "@/lib/resolve-editor-display";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = new Set(["admin", "editor", "super_admin"]);

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }
    if (session.user.role !== "super_admin") {
      return NextResponse.json(
        { error: "Bu işlem yalnızca süper yönetici tarafından yapılabilir" },
        { status: 403 }
      );
    }

    const tenantId = getTenantId();

    const { data: send, error: fetchErr } = await supabaseAdmin
      .from("sms_sends")
      .select("id")
      .eq("id", params.id)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (fetchErr || !send) {
      return NextResponse.json({ error: "Gönderim bulunamadı" }, { status: 404 });
    }

    const { error: unlinkErr } = await supabaseAdmin
      .from("sms_notification_events")
      .update({ send_id: null })
      .eq("send_id", params.id)
      .eq("tenant_id", tenantId);

    if (unlinkErr) {
      console.error("[sms/sends/[id] DELETE] unlink notification events:", unlinkErr);
      return NextResponse.json({ error: "Gönderim silinemedi" }, { status: 500 });
    }

    const { error: delErr } = await supabaseAdmin
      .from("sms_sends")
      .delete()
      .eq("id", params.id)
      .eq("tenant_id", tenantId);

    if (delErr) {
      console.error("[sms/sends/[id] DELETE]", delErr);
      return NextResponse.json({ error: "Gönderim silinemedi" }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[sms/sends/[id] DELETE]", e);
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}

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
        "id, recipient_name, phone_number, raw_phone_number, personalized_message, sms_parts, status, skip_reason, error_code, sent_at, created_at, shareholder_id"
      )
      .eq("send_id", params.id)
      .order("created_at", { ascending: true });

    if (recError) {
      console.error("[sms/sends/[id]]", recError);
      return NextResponse.json({ error: "Alıcılar alınamadı" }, { status: 500 });
    }

    const emailMap = await buildEmailToEditorDisplayMap(supabaseAdmin, [
      send.created_by as string | null | undefined,
    ]);
    const sendEnriched = {
      ...send,
      created_by_display: editorDisplayFromRaw(
        String(send.created_by ?? ""),
        emailMap
      ),
    };

    return NextResponse.json(
      { send: sendEnriched, recipients: recipients ?? [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[sms/sends/[id]]", e);
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}
