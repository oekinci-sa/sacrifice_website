import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/sacrifices/[id]/shareholders - Belirli kurbanlığa ait hissedarları döner
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = getTenantId();
    const { id: sacrificeId } = await params;

    if (!sacrificeId) {
      return NextResponse.json(
        { error: "sacrifice_id gerekli" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("shareholders")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("sacrifice_id", sacrificeId)
      .order("purchase_time", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Hissedar bilgileri alınamadı" },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    return NextResponse.json(data ?? [], {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
