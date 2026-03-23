import { HISSE_AL_AKISI_ACTOR } from '@/lib/admin-editor-session';
import { getDefaultSacrificeYear } from '@/lib/constants/sacrifice-year';
import { getTenantId } from '@/lib/tenant';
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const tenantId = getTenantId();
    const sacrificeYear = getDefaultSacrificeYear();
    const body = await req.json();
    const { sacrifice_id, share_count } = body;

    if (!sacrifice_id || !share_count) {
      return NextResponse.json({ error: "Eksik alanlar" }, { status: 400 });
    }

    const { data: sacrifice, error: fetchError } = await supabaseAdmin
      .from("sacrifice_animals")
      .select("empty_share")
      .eq("tenant_id", tenantId)
      .eq("sacrifice_id", sacrifice_id)
      .eq("sacrifice_year", sacrificeYear)
      .single();

    if (fetchError || !sacrifice) {
      return NextResponse.json({ error: "Kurban kaydı bulunamadı" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const actor = HISSE_AL_AKISI_ACTOR;
    const { error: updateError } = await supabaseAdmin.rpc("rpc_update_sacrifice_core", {
      p_actor: actor,
      p_tenant_id: tenantId,
      p_sacrifice_id: sacrifice_id,
      p_sacrifice_year: sacrificeYear,
      p_patch: {
        empty_share: sacrifice.empty_share + share_count,
        last_edited_by: actor,
        last_edited_time: now,
      },
    });

    if (updateError) {
      return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
