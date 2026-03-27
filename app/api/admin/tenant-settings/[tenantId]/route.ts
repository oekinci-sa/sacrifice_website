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
  "website_url",
  "contact_phone",
  "contact_email",
  "contact_address",
  "active_sacrifice_year",
  "deposit_amount",
  "deposit_deadline_days",
  "full_payment_deadline_month",
  "full_payment_deadline_day",
  "agreement_terms",
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
