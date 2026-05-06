/**
 * GET /api/admin/sms/shareholder-search?year=2026&q=ahmet
 * SMS gönderiminde hissedar araması (isim veya telefon).
 * q boş veya 1 harf: ilk kayıtlar; q 2+ harf: ilike filtre.
 */
import { authOptions } from "@/lib/auth";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = new Set(["admin", "editor", "super_admin"]);

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

    const selectCols =
      `shareholder_id, shareholder_name, phone_number, sacrifice_id, purchase_time,
       sacrifice:sacrifice_animals(sacrifice_no)`;

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
      purchase_time: string | null;
      sacrifice:
        | { sacrifice_no?: number }
        | { sacrifice_no?: number }[]
        | null;
    };

    let rows: RawRow[] = [];

    if (safeQ.length >= 2) {
      const pat = `%${safeQ}%`;
      const [nameRes, phoneRes] = await Promise.all([
        base().ilike("shareholder_name", pat).order("purchase_time", { ascending: true }).limit(80),
        base().ilike("phone_number", pat).order("purchase_time", { ascending: true }).limit(80),
      ]);
      if (nameRes.error || phoneRes.error) {
        console.error("[sms/shareholder-search]", nameRes.error ?? phoneRes.error);
        return NextResponse.json({ error: "Hissedarlar alınamadı" }, { status: 500 });
      }
      const merged = new Map<string, RawRow>();
      for (const r of [...(nameRes.data ?? []), ...(phoneRes.data ?? [])] as RawRow[]) {
        const k = `${r.shareholder_id}:${r.sacrifice_id}`;
        if (!merged.has(k)) merged.set(k, r);
      }
      rows = Array.from(merged.values()).sort((a, b) => {
        const ta = a.purchase_time ? new Date(a.purchase_time).getTime() : 0;
        const tb = b.purchase_time ? new Date(b.purchase_time).getTime() : 0;
        return ta - tb;
      });
      rows = rows.slice(0, 80);
    } else {
      const { data, error } = await base()
        .order("purchase_time", { ascending: true })
        .limit(50);
      if (error) {
        console.error("[sms/shareholder-search]", error);
        return NextResponse.json({ error: "Hissedarlar alınamadı" }, { status: 500 });
      }
      rows = (data ?? []) as RawRow[];
    }

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

    return NextResponse.json(
      { results },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[sms/shareholder-search]", e);
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}
