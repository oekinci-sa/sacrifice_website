import { authOptions } from "@/lib/auth";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { SMS_STAGE_AUTO_EVENT_KEYS } from "@/lib/sms-event-keys";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = new Set(["admin", "editor", "super_admin"]);

/** Kayıt yoksa dönen güvenli default değerler (event bazında). */
const DEFAULT_SETTINGS: Record<
  string,
  {
    target_offset: number | null;
    recipient_scope: string;
    skip_if_target_missing: boolean;
    skip_if_target_completed: boolean;
  }
> = {
  slaughter_approaching: { target_offset: 20,   recipient_scope: "slaughterhouse_only", skip_if_target_missing: true,  skip_if_target_completed: true },
  slaughter_imminent:   { target_offset: 3,    recipient_scope: "slaughterhouse_only", skip_if_target_missing: true,  skip_if_target_completed: true },
  slaughter_completed:  { target_offset: null, recipient_scope: "all",                 skip_if_target_missing: false, skip_if_target_completed: false },
  butcher_started:      { target_offset: null, recipient_scope: "slaughterhouse_only", skip_if_target_missing: true,  skip_if_target_completed: true },
  delivery_completed:   { target_offset: null, recipient_scope: "all",                 skip_if_target_missing: false, skip_if_target_completed: false },
};

export type AutoEventSettingRow = {
  event_key: string;
  target_offset: number | null;
  recipient_scope: string;
  skip_if_target_missing: boolean;
  skip_if_target_completed: boolean;
};

/**
 * GET /api/admin/sms/auto-event-settings
 * Tenant'ın sıra ekranlarından çalışan otomatik SMS ayarlarını döner.
 * DB'de kayıt yoksa default değerlerle doldurulur.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !ADMIN_ROLES.has(session.user.role)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const tenantId = getTenantId();

    const { data, error } = await supabaseAdmin
      .from("sms_auto_event_settings")
      .select(
        "event_key, target_offset, recipient_scope, skip_if_target_missing, skip_if_target_completed"
      )
      .eq("tenant_id", tenantId)
      .in("event_key", SMS_STAGE_AUTO_EVENT_KEYS as unknown as string[]);

    if (error) {
      console.error("[auto-event-settings GET]", error);
      return NextResponse.json({ error: "Ayarlar alınamadı" }, { status: 500 });
    }

    // Eksik kayıtları default değerlerle tamamla
    const dbMap = new Map((data ?? []).map((r) => [r.event_key, r]));
    const settings: AutoEventSettingRow[] = SMS_STAGE_AUTO_EVENT_KEYS.map((key) => {
      const db = dbMap.get(key);
      const def = DEFAULT_SETTINGS[key];
      return {
        event_key: key,
        target_offset:              db?.target_offset              ?? def.target_offset,
        recipient_scope:            db?.recipient_scope            ?? def.recipient_scope,
        skip_if_target_missing:     db?.skip_if_target_missing     ?? def.skip_if_target_missing,
        skip_if_target_completed:   db?.skip_if_target_completed   ?? def.skip_if_target_completed,
      };
    });

    return NextResponse.json({ settings });
  } catch (e) {
    console.error("[auto-event-settings GET]", e);
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}
