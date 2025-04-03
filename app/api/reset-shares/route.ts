import { supabase } from "@/utils/supabaseClient";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sacrifice_id, share_count } = body;

    if (!sacrifice_id || !share_count) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Önce mevcut kurban bilgilerini al
    const { data: sacrifice, error: fetchError } = await supabase
      .from("sacrifice_animals")
      .select("empty_share")
      .eq("sacrifice_id", sacrifice_id)
      .single();

    if (fetchError || !sacrifice) {
      return NextResponse.json({ error: "Sacrifice not found" }, { status: 404 });
    }

    // Boş hisse sayısını artır
    const { error: updateError } = await supabase
      .from("sacrifice_animals")
      .update({ empty_share: sacrifice.empty_share + share_count })
      .eq("sacrifice_id", sacrifice_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resetting shares:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 