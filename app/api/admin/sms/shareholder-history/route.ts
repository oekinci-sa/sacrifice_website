/**
 * GET /api/admin/sms/shareholder-history?shareholderId=<uuid>
 *
 * Belirli bir hissedarın SMS iletişim geçmişini döner.
 * sms_send_recipients JOIN sms_sends ile son 50 kayıt.
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
    const shareholderId = searchParams.get("shareholderId");

    if (!shareholderId) {
      return NextResponse.json({ error: "shareholderId zorunlu" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("sms_send_recipients")
      .select(
        `id,
         personalized_message,
         status,
         dlr_status,
         sent_at,
         created_at,
         sms_parts,
         sms_sends!inner (
           id,
           title
         )`
      )
      .eq("shareholder_id", shareholderId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[sms/shareholder-history]", error);
      return NextResponse.json({ error: "Geçmiş alınamadı" }, { status: 500 });
    }

    const history = (data ?? []).map((r) => {
      const send = r.sms_sends as unknown as { id: string; title: string };
      return {
        id: r.id,
        send_id: send?.id ?? null,
        send_title: send?.title ?? null,
        message_summary:
          typeof r.personalized_message === "string" && r.personalized_message.length > 80
            ? r.personalized_message.slice(0, 80) + "…"
            : r.personalized_message,
        status: r.status,
        dlr_status: r.dlr_status ?? null,
        sms_parts: r.sms_parts ?? null,
        sent_at: r.sent_at ?? null,
        created_at: r.created_at,
      };
    });

    return NextResponse.json({ history });
  } catch (e) {
    console.error("[sms/shareholder-history]", e);
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}
