import { authOptions } from "@/lib/auth";
import {
  getSessionActorEmail,
  sessionHasAdminEditorOrSuperRole,
} from "@/lib/admin-editor-session";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { recalculateStageMetricsAverages } from "@/lib/stage-metrics-recalculate";
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

const updateSchema = z.object({
  affected_stage: z.enum(["slaughter", "butcher", "delivery"]),
  started_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "HH:MM formatında saat giriniz"),
  ended_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "HH:MM formatında saat giriniz"),
  duration_minutes: z.number().int().min(0),
  note: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v == null || v.trim() === "" ? null : v.trim())),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!sessionHasAdminEditorOrSuperRole(session)) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401, headers: NO_CACHE });
    }

    const actor = getSessionActorEmail(session);
    if (!actor) {
      return NextResponse.json({ error: "Oturumda e-posta bulunamadı" }, { status: 400, headers: NO_CACHE });
    }

    const tenantId = getTenantId();
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400, headers: NO_CACHE });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Geçersiz veri" },
        { status: 400, headers: NO_CACHE }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("stage_downtime_events")
      .update({
        affected_stage: parsed.data.affected_stage,
        started_time: parsed.data.started_time,
        ended_time: parsed.data.ended_time,
        duration_minutes: parsed.data.duration_minutes,
        note: parsed.data.note ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Arıza kaydı güncellenemedi" }, { status: 500, headers: NO_CACHE });
    }

    if (!data) {
      return NextResponse.json({ error: "Arıza kaydı bulunamadı" }, { status: 404, headers: NO_CACHE });
    }

    try {
      await recalculateStageMetricsAverages(tenantId, data.sacrifice_year);
    } catch {
      return NextResponse.json(
        { error: "Arıza kaydı güncellendi ancak ortalama süreler güncellenemedi" },
        { status: 500, headers: NO_CACHE }
      );
    }

    return NextResponse.json({ data }, { headers: NO_CACHE });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500, headers: NO_CACHE });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!sessionHasAdminEditorOrSuperRole(session)) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401, headers: NO_CACHE });
    }

    const tenantId = getTenantId();
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400, headers: NO_CACHE });
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("stage_downtime_events")
      .select("sacrifice_year")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Arıza kaydı bulunamadı" }, { status: 404, headers: NO_CACHE });
    }

    const { error } = await supabaseAdmin
      .from("stage_downtime_events")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) {
      return NextResponse.json({ error: "Arıza kaydı silinemedi" }, { status: 500, headers: NO_CACHE });
    }

    try {
      await recalculateStageMetricsAverages(tenantId, existing.sacrifice_year);
    } catch {
      return NextResponse.json(
        { error: "Arıza kaydı silindi ancak ortalama süreler güncellenemedi" },
        { status: 500, headers: NO_CACHE }
      );
    }

    return NextResponse.json({ success: true }, { headers: NO_CACHE });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500, headers: NO_CACHE });
  }
}
