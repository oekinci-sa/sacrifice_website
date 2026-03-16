import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/mismatched-shares/revoke
 * Body: { sacrifice_id: string }
 * Geri Al - Bilinenler tabından Bilinmeyenler tabına taşır
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
    }

    const tenantId = getTenantId();
    const body = await request.json();
    const sacrifice_id = body?.sacrifice_id;

    if (!sacrifice_id || typeof sacrifice_id !== "string") {
      return NextResponse.json(
        { error: "sacrifice_id gerekli" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("mismatched_share_acknowledgments")
      .delete()
      .eq("sacrifice_id", sacrifice_id)
      .eq("tenant_id", tenantId);

    if (error) {
      return NextResponse.json(
        { error: "Geri alınamadı", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
