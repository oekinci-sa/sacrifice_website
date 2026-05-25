import { getDefaultSacrificeYear } from "@/lib/constants/sacrifice-year";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

/**
 * GET /api/get-shareholders-by-sacrifice-no?sacrifice_no=12
 * Operator sıra ekranlarında (kesim/parçalama/teslimat) kullanılır.
 * Belirli kurban numarasına ait hissedarları döner (hafif — sadece gerekli alanlar).
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId();
    const sacrificeYear = getDefaultSacrificeYear();
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get("sacrifice_no");

    if (!raw) {
      return NextResponse.json(
        { error: "sacrifice_no zorunlu" },
        { status: 400, headers: NO_CACHE }
      );
    }

    const sacrificeNo = parseInt(raw, 10);
    if (isNaN(sacrificeNo) || sacrificeNo < 1) {
      return NextResponse.json(
        { error: "sacrifice_no geçersiz" },
        { status: 400, headers: NO_CACHE }
      );
    }

    const { data: animal, error: animalErr } = await supabaseAdmin
      .from("sacrifice_animals")
      .select("sacrifice_id")
      .eq("tenant_id", tenantId)
      .eq("sacrifice_year", sacrificeYear)
      .eq("sacrifice_no", sacrificeNo)
      .maybeSingle();

    if (animalErr) {
      return NextResponse.json({ error: "Kurbanlık sorgulanamadı" }, { status: 500, headers: NO_CACHE });
    }

    if (!animal?.sacrifice_id) {
      return NextResponse.json({ shareholders: [] }, { headers: NO_CACHE });
    }

    const { data, error } = await supabaseAdmin
      .from("shareholders")
      .select("shareholder_id, shareholder_name, phone_number, delivery_type, delivery_location, paid_amount, total_amount, remaining_payment")
      .eq("tenant_id", tenantId)
      .eq("sacrifice_year", sacrificeYear)
      .eq("sacrifice_id", animal.sacrifice_id)
      .order("purchase_time", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "Hissedarlar alınamadı" }, { status: 500, headers: NO_CACHE });
    }

    return NextResponse.json({ shareholders: data ?? [] }, { headers: NO_CACHE });
  } catch {
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500, headers: NO_CACHE });
  }
}
