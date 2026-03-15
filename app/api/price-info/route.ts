import { resolveSacrificeYearForTenant } from "@/lib/sacrifice-year-resolver";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Tenant'a özgü hisse bedelleri (kg, price) ve tükenme durumu.
 * sacrifice_animals tablosundan distinct (share_weight, share_price) + toplam empty_share.
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId();
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const sacrificeYear = await resolveSacrificeYearForTenant(tenantId, yearParam);

    const { data, error } = await supabaseAdmin
      .from("sacrifice_animals")
      .select("share_weight, share_price, empty_share")
      .eq("tenant_id", tenantId)
      .eq("sacrifice_year", sacrificeYear);

    if (error) {
      return NextResponse.json(
        { error: "Hisse bedelleri alınamadı" },
        { status: 500 }
      );
    }

    // (share_weight, share_price) bazında grupla, empty_share topla
    const map = new Map<string, { kg: number; price: number; totalEmptyShare: number }>();
    for (const row of data ?? []) {
      const key = `${row.share_weight}-${row.share_price}`;
      const existing = map.get(key);
      const emptyShare = Number(row.empty_share ?? 0);
      if (existing) {
        existing.totalEmptyShare += emptyShare;
      } else {
        map.set(key, {
          kg: Number(row.share_weight),
          price: Number(row.share_price),
          totalEmptyShare: emptyShare,
        });
      }
    }

    const items = Array.from(map.values())
      .sort((a, b) => a.price - b.price)
      .map((item) => ({
        kg: item.kg,
        price: item.price,
        soldOut: item.totalEmptyShare === 0,
      }));

    return NextResponse.json(items, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Beklenmeyen hata" },
      { status: 500 }
    );
  }
}
