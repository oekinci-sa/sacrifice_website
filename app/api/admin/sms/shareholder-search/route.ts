/**
 * GET /api/admin/sms/shareholder-search?year=2026&q=ahmet&offset=0&limit=50
 * SMS gönderiminde hissedar araması (isim veya telefon).
 * q boş veya 1 harf: tüm liste; q 2+ harf: ilike filtre.
 * Sıra: kurban no → isim (alfabetik).
 */
import { authOptions } from "@/lib/auth";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = new Set(["admin", "editor", "super_admin"]);
const PAGE_SIZE_DEFAULT = 50;
const PAGE_SIZE_MAX = 100;

/** ilike içinde % ve _ güvenliği */
function safeIlikeFragment(raw: string): string {
  return raw.replace(/\\/g, "").replace(/%/g, "").replace(/_/g, "").trim();
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !ADMIN_ROLES.has(session.user.role)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const sp = request.nextUrl.searchParams;
    const yearParam = sp.get("year");
    const sacrificeYear = yearParam ? parseInt(yearParam, 10) : NaN;
    if (!Number.isFinite(sacrificeYear) || sacrificeYear < 2000 || sacrificeYear > 2100) {
      return NextResponse.json(
        { error: "Geçerli bir yıl gerekli (?year=2026)" },
        { status: 400 }
      );
    }

    const qRaw = sp.get("q")?.trim() ?? "";
    const safeQ = safeIlikeFragment(qRaw);
    const tenantId = getTenantId();

    const offsetParam = parseInt(sp.get("offset") ?? "0", 10);
    const limitParam = parseInt(sp.get("limit") ?? String(PAGE_SIZE_DEFAULT), 10);
    const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;
    const limit = Math.min(
      PAGE_SIZE_MAX,
      Math.max(1, Number.isFinite(limitParam) ? limitParam : PAGE_SIZE_DEFAULT)
    );

    const selectCols =
      `shareholder_id, shareholder_name, phone_number, sacrifice_id,
       sacrifice:sacrifice_animals!inner(sacrifice_no)`;

    const base = () =>
      supabaseAdmin
        .from("shareholders")
        .select(selectCols)
        .eq("tenant_id", tenantId)
        .eq("sacrifice_year", sacrificeYear);

    type RawRow = {
      shareholder_id: string;
      shareholder_name: string | null;
      phone_number: string | null;
      sacrifice_id: string;
      sacrifice:
        | { sacrifice_no?: number }
        | { sacrifice_no?: number }[]
        | null;
    };

    let query = base();
    if (safeQ.length >= 2) {
      const pat = `%${safeQ}%`;
      query = query.or(`shareholder_name.ilike.${pat},phone_number.ilike.${pat}`);
    }

    const { data, error } = await query
      .order("sacrifice_animals(sacrifice_no)", { ascending: true })
      .order("shareholder_name", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[sms/shareholder-search]", error);
      return NextResponse.json({ error: "Hissedarlar alınamadı" }, { status: 500 });
    }

    const rows = (data ?? []) as RawRow[];

    const results = rows.map((row: RawRow) => {
      const sacRel = row.sacrifice;
      const sac = Array.isArray(sacRel) ? sacRel[0] : sacRel;
      const sacrifice_no =
        sac?.sacrifice_no != null && Number.isFinite(sac.sacrifice_no)
          ? sac.sacrifice_no
          : null;
      return {
        shareholder_id: row.shareholder_id,
        shareholder_name: (row.shareholder_name as string) ?? "",
        phone_number: row.phone_number as string | null,
        sacrifice_id: row.sacrifice_id as string,
        sacrifice_no,
      };
    });

    const hasMore = rows.length === limit;

    return NextResponse.json(
      { results, hasMore, nextOffset: offset + rows.length },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[sms/shareholder-search]", e);
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}
