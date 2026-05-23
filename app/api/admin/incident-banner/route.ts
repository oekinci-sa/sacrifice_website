import { authOptions } from "@/lib/auth";
import { sessionHasAdminEditorOrSuperRole } from "@/lib/admin-editor-session";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

const bannerSchema = z.object({
  incident_banner_enabled: z.boolean(),
  incident_banner_message: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!sessionHasAdminEditorOrSuperRole(session)) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401, headers: NO_CACHE });
    }

    const tenantId = getTenantId();

    const { data, error } = await supabaseAdmin
      .from("tenant_settings")
      .select("incident_banner_enabled, incident_banner_message")
      .eq("tenant_id", tenantId)
      .single();

    if (error) {
      return NextResponse.json({ error: "Banner bilgisi alınamadı" }, { status: 500, headers: NO_CACHE });
    }

    return NextResponse.json(
      {
        incident_banner_enabled: data?.incident_banner_enabled ?? false,
        incident_banner_message: data?.incident_banner_message ?? "",
      },
      { headers: NO_CACHE }
    );
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500, headers: NO_CACHE });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!sessionHasAdminEditorOrSuperRole(session)) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401, headers: NO_CACHE });
    }

    const tenantId = getTenantId();
    const body = await request.json();

    const parsed = bannerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Geçersiz veri" },
        { status: 400, headers: NO_CACHE }
      );
    }

    const { error } = await supabaseAdmin
      .from("tenant_settings")
      .update({
        incident_banner_enabled: parsed.data.incident_banner_enabled,
        incident_banner_message: parsed.data.incident_banner_message ?? null,
      })
      .eq("tenant_id", tenantId);

    if (error) {
      return NextResponse.json({ error: "Banner güncellenemedi" }, { status: 500, headers: NO_CACHE });
    }

    return NextResponse.json({ success: true }, { headers: NO_CACHE });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500, headers: NO_CACHE });
  }
}
