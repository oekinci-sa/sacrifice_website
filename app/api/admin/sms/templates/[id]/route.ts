import { authOptions } from "@/lib/auth";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = new Set(["admin", "editor", "super_admin"]);
const CAN_DELETE = new Set(["admin", "super_admin"]);

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional().nullable(),
  category: z
    .enum(["genel", "odeme", "kesim", "teslimat", "bilgilendirme"])
    .optional(),
  content: z.string().min(1).max(882).optional(),
  variables: z.array(z.string()).optional().nullable(),
  is_active: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session?.user || !role || !ADMIN_ROLES.has(role)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
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
    const { data: existing } = await supabaseAdmin
      .from("sms_templates")
      .select("id")
      .eq("id", params.id)
      .eq("tenant_id", tenantId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Şablon bulunamadı" }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from("sms_templates")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .eq("tenant_id", tenantId);

    if (error) {
      console.error("[sms/templates PUT]", error);
      return NextResponse.json({ error: "Şablon güncellenemedi" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[sms/templates PUT]", e);
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}

/**
 * Soft delete: is_active = false.
 * Gerçek silme yerine pasife alma tercih edilir (gönderim geçmişi korunur).
 * Yalnızca admin ve super_admin yapabilir.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session?.user || !role || !CAN_DELETE.has(role)) {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok" },
        { status: 403 }
      );
    }

    const tenantId = getTenantId();
    const { data: existing } = await supabaseAdmin
      .from("sms_templates")
      .select("id")
      .eq("id", params.id)
      .eq("tenant_id", tenantId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Şablon bulunamadı" }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from("sms_templates")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .eq("tenant_id", tenantId);

    if (error) {
      console.error("[sms/templates DELETE]", error);
      return NextResponse.json({ error: "Şablon pasife alınamadı" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[sms/templates DELETE]", e);
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}
