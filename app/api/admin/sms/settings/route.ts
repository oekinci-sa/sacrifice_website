import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tenantId = getTenantId();

    const { data, error } = await supabaseAdmin
      .from("tenant_settings")
      .select("sms_auto_enabled, sms_slaughter_approach_offset, sms_delivery_pickup_offset")
      .eq("tenant_id", tenantId)
      .single();

    if (error) {
      return NextResponse.json({ error: "Ayarlar alınamadı" }, { status: 500 });
    }

    return NextResponse.json({
      sms_auto_enabled: data?.sms_auto_enabled ?? false,
      sms_slaughter_approach_offset: data?.sms_slaughter_approach_offset ?? 20,
      sms_delivery_pickup_offset: data?.sms_delivery_pickup_offset ?? 2,
    });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

const PatchSchema = z.object({
  sms_auto_enabled: z.boolean(),
});

export async function PATCH(request: NextRequest) {
  try {
    const tenantId = getTenantId();
    const body = await request.json();
    const parsed = PatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("tenant_settings")
      .update({ sms_auto_enabled: parsed.data.sms_auto_enabled })
      .eq("tenant_id", tenantId);

    if (error) {
      return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
