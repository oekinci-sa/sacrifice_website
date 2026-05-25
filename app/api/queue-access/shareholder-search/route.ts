import { isPageKey } from "@/lib/queue-access-hash";
import { getDefaultSacrificeYear } from "@/lib/constants/sacrifice-year";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getTenantId } from "@/lib/tenant";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

function getSecret(): Uint8Array {
  const s = process.env.QUEUE_ACCESS_SECRET;
  if (!s) throw new Error("QUEUE_ACCESS_SECRET is not set");
  return new TextEncoder().encode(s);
}

async function verifyAccess(pageKey: string, tenantId: string): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(`qa_token_${pageKey}`)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.pageKey === pageKey && payload.tenantId === tenantId;
  } catch {
    return false;
  }
}

/** GET /api/queue-access/shareholder-search?q=<metin>&pageKey=<key> */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const pageKey = searchParams.get("pageKey");
  const q = searchParams.get("q")?.trim() ?? "";

  if (!pageKey || !isPageKey(pageKey)) {
    return NextResponse.json({ error: "Geçersiz sayfa anahtarı" }, { status: 400, headers: NO_CACHE });
  }

  if (q.length < 2) {
    return NextResponse.json({ shareholders: [] }, { headers: NO_CACHE });
  }

  const tenantId = getTenantId();
  const hasAccess = await verifyAccess(pageKey, tenantId);
  if (!hasAccess) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401, headers: NO_CACHE });
  }

  const sacrificeYear = getDefaultSacrificeYear();

  const { data, error } = await supabaseAdmin
    .from("shareholders")
    .select(
      `shareholder_id, shareholder_name, phone_number,
       delivery_type, delivery_location,
       paid_amount, total_amount, remaining_payment,
       sacrifice_animals!inner(sacrifice_no)`
    )
    .eq("tenant_id", tenantId)
    .eq("sacrifice_year", sacrificeYear)
    .or(`shareholder_name.ilike.%${q}%,phone_number.ilike.%${q}%`)
    .order("sacrifice_no", { referencedTable: "sacrifice_animals", ascending: true })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: "Arama yapılamadı" }, { status: 500, headers: NO_CACHE });
  }

  const shareholders = (data ?? []).map((row) => ({
    shareholder_id: row.shareholder_id,
    shareholder_name: row.shareholder_name,
    phone_number: row.phone_number,
    delivery_type: row.delivery_type,
    delivery_location: row.delivery_location,
    paid_amount: row.paid_amount,
    total_amount: row.total_amount,
    remaining_payment: row.remaining_payment,
    sacrifice_no: (row.sacrifice_animals as unknown as { sacrifice_no: number } | null)?.sacrifice_no ?? null,
  }));

  return NextResponse.json({ shareholders }, { headers: NO_CACHE });
}
