import { authOptions } from "@/lib/auth";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  isSmsOffsetAutoEventKey,
  SMS_STAGE_AUTO_EVENT_KEYS,
} from "@/lib/sms-event-keys";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = new Set(["admin", "editor", "super_admin"]);

const updateSchema = z.object({
  target_offset: z.number().int().min(1).max(50).nullable(),
  recipient_scope: z.enum(["all", "slaughterhouse_only", "external_only"]),
});

/**
 * PUT /api/admin/sms/auto-event-settings/[eventKey]
 * Event başına gönderim kuralını günceller (upsert).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { eventKey: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session?.user || !role || !ADMIN_ROLES.has(role)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { eventKey } = params;
    if (!(SMS_STAGE_AUTO_EVENT_KEYS as readonly string[]).includes(eventKey)) {
      return NextResponse.json({ error: "Geçersiz event_key" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const tenantId = getTenantId();
    const now = new Date().toISOString();
    const skipFlags = isSmsOffsetAutoEventKey(eventKey)
      ? { skip_if_target_missing: true, skip_if_target_completed: true }
      : { skip_if_target_missing: false, skip_if_target_completed: false };

    const { error } = await supabaseAdmin
      .from("sms_auto_event_settings")
      .upsert(
        {
          tenant_id: tenantId,
          event_key: eventKey,
          ...parsed.data,
          ...skipFlags,
          updated_at: now,
        },
        { onConflict: "tenant_id,event_key" }
      );

    if (error) {
      console.error("[auto-event-settings PUT]", error);
      return NextResponse.json({ error: "Ayar kaydedilemedi" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[auto-event-settings PUT]", e);
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}
