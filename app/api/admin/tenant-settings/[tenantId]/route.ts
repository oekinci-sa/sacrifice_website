import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const UPDATABLE_FIELDS = [
  "theme_json",
  "homepage_mode",
  "logo_slug",
  "iban",
  "iban_account_holder",
  "website_url",
  "contact_phone",
  "contact_email",
  "contact_address",
  "contact_address_label",
  "contact_email_label",
  "contact_phone_label",
  "contact_social_links",
  "active_sacrifice_year",
  "deposit_amount",
  "deposit_deadline_days",
  "full_payment_deadline_month",
  "full_payment_deadline_day",
  "agreement_terms",
  "agreement_dialog_title",
  "agreement_main_heading",
  "agreement_intro_text",
  "agreement_footer_text",
  "agreement_notice_after_term_title",
  "agreement_notice_after_term_body",
  "sms_enabled",
  "sms_auto_enabled",
  "sms_payment_enabled",
  "sms_slaughter_approach_offset",
  "sms_delivery_pickup_offset",
  "planned_delivery_offset_minutes",
] as const;

/**
 * PATCH /api/admin/tenant-settings/[tenantId] - Tenant ayarlarını günceller (sadece super_admin)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "super_admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { tenantId } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    for (const key of UPDATABLE_FIELDS) {
      if (key in body) {
        updates[key] = body[key];
      }
    }
    updates.updated_at = new Date().toISOString();

    if (Object.keys(updates).length <= 1) {
      return NextResponse.json(
        { error: "Güncellenecek alan bulunamadı" },
        { status: 400 }
      );
    }

    // Fetch current settings to detect offset change and get active year
    const { data: currentSettings } = await supabaseAdmin
      .from("tenant_settings")
      .select("planned_delivery_offset_minutes, active_sacrifice_year")
      .eq("tenant_id", tenantId)
      .single();

    const { data, error } = await supabaseAdmin
      .from("tenant_settings")
      .update(updates)
      .eq("tenant_id", tenantId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Tenant ayarları güncellenemedi" },
        { status: 500 }
      );
    }

    // If the delivery offset changed, bulk-update all sacrifice_animals for the active year
    const newOffset = updates.planned_delivery_offset_minutes as number | undefined;
    if (
      newOffset !== undefined &&
      currentSettings &&
      newOffset !== currentSettings.planned_delivery_offset_minutes
    ) {
      const activeYear =
        (updates.active_sacrifice_year as number | undefined) ??
        currentSettings.active_sacrifice_year;
      if (activeYear) {
        await supabaseAdmin.rpc("bulk_update_planned_delivery_time", {
          p_tenant_id: tenantId,
          p_sacrifice_year: activeYear,
          p_offset_minutes: newOffset,
        });
      }
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch {
    return NextResponse.json(
      { error: "Beklenmeyen hata" },
      { status: 500 }
    );
  }
}
