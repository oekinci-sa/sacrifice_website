import { authOptions } from "@/lib/auth";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = new Set(["admin", "editor", "super_admin"]);

import { SMS_AUTO_EVENT_KEYS } from "@/lib/sms-event-keys";

const EVENT_KEYS = SMS_AUTO_EVENT_KEYS;

const templateSchema = z.object({
  title: z.string().min(1, "Başlık zorunlu").max(200),
  description: z.string().max(500).optional().nullable(),
  category: z
    .enum(["genel", "odeme", "kesim", "teslimat", "bilgilendirme"])
    .default("genel"),
  content: z.string().min(1, "Mesaj içeriği zorunlu").max(882),
  content_external: z.string().max(882).optional().nullable(),
  variables: z.array(z.string()).optional().nullable(),
  is_active: z.boolean().default(true),
  event_key: z.enum(EVENT_KEYS).optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !ADMIN_ROLES.has(session.user.role)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const tenantId = getTenantId();
    const category =
      request.nextUrl.searchParams.get("category") ?? undefined;
    const inactiveOnly =
      request.nextUrl.searchParams.get("inactive") === "true";
    const activeOnly =
      request.nextUrl.searchParams.get("active") !== "false";

    let query = supabaseAdmin
      .from("sms_templates")
      .select("id, title, description, category, content, content_external, variables, is_active, event_key, created_by, created_at, updated_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (inactiveOnly) {
      query = query.eq("is_active", false);
    } else if (activeOnly) {
      query = query.eq("is_active", true);
    }
    if (category) query = query.eq("category", category);

    const { data, error } = await query;
    if (error) {
      console.error("[sms/templates GET]", error);
      return NextResponse.json({ error: "Şablonlar alınamadı" }, { status: 500 });
    }

    return NextResponse.json({ templates: data ?? [] });
  } catch (e) {
    console.error("[sms/templates GET]", e);
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session?.user || !role || !ADMIN_ROLES.has(role)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = templateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (
      parsed.data.event_key === "delivery_completed" &&
      (!parsed.data.content_external || !parsed.data.content_external.trim())
    ) {
      return NextResponse.json(
        { error: "Teslim edildi şablonunda kesimhane dışı mesaj metni zorunlu" },
        { status: 400 }
      );
    }

    const tenantId = getTenantId();
    const { variables, event_key, ...rest } = parsed.data;

    const { data, error } = await supabaseAdmin
      .from("sms_templates")
      .insert({
        ...rest,
        variables: variables ?? null,
        event_key: event_key ?? null,
        tenant_id: tenantId,
        created_by: session.user.email ?? session.user.name ?? "Bilinmeyen",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[sms/templates POST]", error);
      return NextResponse.json({ error: "Şablon oluşturulamadı" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
  } catch (e) {
    console.error("[sms/templates POST]", e);
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}
