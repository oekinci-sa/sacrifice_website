import { getTenantId } from '@/lib/tenant';
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const tenantId = getTenantId();
    const body = await req.json();
    const { sacrifice_id, share_count } = body;

    if (!sacrifice_id || !share_count) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: sacrifice, error: fetchError } = await supabaseAdmin
      .from("sacrifice_animals")
      .select("empty_share")
      .eq("tenant_id", tenantId)
      .eq("sacrifice_id", sacrifice_id)
      .single();

    if (fetchError || !sacrifice) {
      return NextResponse.json({ error: "Sacrifice not found" }, { status: 404 });
    }

    const { error: updateError } = await supabaseAdmin
      .from("sacrifice_animals")
      .update({ empty_share: sacrifice.empty_share + share_count })
      .eq("tenant_id", tenantId)
      .eq("sacrifice_id", sacrifice_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 