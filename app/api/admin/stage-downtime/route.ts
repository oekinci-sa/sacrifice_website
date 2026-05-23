import { authOptions } from "@/lib/auth";
import {
  getSessionActorEmail,
  sessionHasAdminEditorOrSuperRole,
} from "@/lib/admin-editor-session";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveSacrificeYearForTenant } from "@/lib/sacrifice-year-resolver";
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

const downtimeSchema = z.object({
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!sessionHasAdminEditorOrSuperRole(session)) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401, headers: NO_CACHE });
    }

    const tenantId = getTenantId();
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const sacrificeYear = await resolveSacrificeYearForTenant(tenantId, yearParam);

    const { data, error } = await supabaseAdmin
      .from("stage_downtime_events")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("sacrifice_year", sacrificeYear)
      .order("affected_stage", { ascending: true })
      .order("started_time", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "Arıza kayıtları alınamadı" }, { status: 500, headers: NO_CACHE });
    }

    return NextResponse.json({ data, sacrifice_year: sacrificeYear }, { headers: NO_CACHE });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500, headers: NO_CACHE });
  }
}

export async function POST(request: NextRequest) {
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
    const body = await request.json();

    const parsed = downtimeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Geçersiz veri" },
        { status: 400, headers: NO_CACHE }
      );
    }

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const sacrificeYear = await resolveSacrificeYearForTenant(tenantId, yearParam);

    const { data, error } = await supabaseAdmin
      .from("stage_downtime_events")
      .insert({
        tenant_id: tenantId,
        sacrifice_year: sacrificeYear,
        affected_stage: parsed.data.affected_stage,
        started_time: parsed.data.started_time,
        ended_time: parsed.data.ended_time,
        duration_minutes: parsed.data.duration_minutes,
        note: parsed.data.note ?? null,
        created_by: actor,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Arıza kaydı oluşturulamadı" }, { status: 500, headers: NO_CACHE });
    }

    try {
      await recalculateStageMetricsAverages(tenantId, sacrificeYear);
    } catch {
      return NextResponse.json(
        { error: "Arıza kaydı eklendi ancak ortalama süreler güncellenemedi" },
        { status: 500, headers: NO_CACHE }
      );
    }

    return NextResponse.json({ data }, { status: 201, headers: NO_CACHE });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500, headers: NO_CACHE });
  }
}
