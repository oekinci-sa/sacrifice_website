import { authOptions } from "@/lib/auth";
import { normalizeEmail } from "@/lib/email-utils";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = new Set(["admin", "editor", "super_admin"]);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session?.user || !role || !ADMIN_ROLES.has(role)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const yearParam = request.nextUrl.searchParams.get("year");
    const sacrificeYear = yearParam ? parseInt(yearParam, 10) : NaN;
    if (!Number.isFinite(sacrificeYear) || sacrificeYear < 2000 || sacrificeYear > 2100) {
      return NextResponse.json(
        { error: "Geçerli bir yıl sorgu parametresi gerekli (?year=2026)" },
        { status: 400 }
      );
    }

    const tenantId = getTenantId();

    const { data: userTenants, error: utError } = await supabaseAdmin
      .from("user_tenants")
      .select("user_id, approved_at")
      .eq("tenant_id", tenantId);

    if (utError) {
      return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
    }

    const utMap = new Map(
      (userTenants ?? []).map((ut: { user_id: string; approved_at: string | null }) => [
        ut.user_id,
        ut.approved_at,
      ])
    );
    const userIds = Array.from(utMap.keys());

    let panelUsers: Array<{
      id: string;
      email: string | null;
      name: string | null;
      status: string | null;
      role: string | null;
      tenant_approved_at: string | null;
    }> = [];

    if (userIds.length > 0) {
      const { data: usersData, error: uError } = await supabaseAdmin
        .from("users")
        .select("id, email, name, status, role")
        .in("id", userIds)
        .order("created_at", { ascending: false });

      if (uError) {
        return NextResponse.json({ error: "Kullanıcılar alınamadı" }, { status: 500 });
      }

      panelUsers = (usersData ?? []).map((u) => ({
        id: u.id as string,
        email: u.email as string | null,
        name: u.name as string | null,
        status: u.status as string | null,
        role: u.role as string | null,
        tenant_approved_at: (utMap.get(u.id as string) as string | null | undefined) ?? null,
      }));
    }

    const { data: shRows, error: shError } = await supabaseAdmin
      .from("shareholders")
      .select("shareholder_name, email, sacrifice_year")
      .eq("tenant_id", tenantId)
      .eq("sacrifice_year", sacrificeYear)
      .not("email", "is", null)
      .order("purchase_time", { ascending: false });

    if (shError) {
      return NextResponse.json({ error: "Hissedarlar alınamadı" }, { status: 500 });
    }

    const seen = new Set<string>();
    const shareholderContacts: Array<{
      email: string;
      shareholder_name: string;
      sacrifice_year: number;
    }> = [];

    for (const row of shRows ?? []) {
      const raw = row.email as string | null | undefined;
      if (!raw?.trim()) continue;
      const key = normalizeEmail(raw);
      if (seen.has(key)) continue;
      seen.add(key);
      shareholderContacts.push({
        email: raw.trim(),
        shareholder_name: (row.shareholder_name as string) ?? "",
        sacrifice_year: row.sacrifice_year as number,
      });
    }

    const { data: rrRows, error: rrError } = await supabaseAdmin
      .from("reminder_requests")
      .select("id, name, phone, sacrifice_year, email")
      .eq("tenant_id", tenantId)
      .eq("sacrifice_year", sacrificeYear)
      .order("created_at", { ascending: false });

    if (rrError) {
      return NextResponse.json({ error: "Bana haber ver talepleri alınamadı" }, { status: 500 });
    }

    const reminderContacts = (rrRows ?? []).map((r) => ({
      id: r.id as string,
      name: (r.name as string) ?? "",
      phone: (r.phone as string) ?? "",
      sacrifice_year: r.sacrifice_year as number,
      email: (r.email as string | null) ?? null,
    }));

    return NextResponse.json(
      { panelUsers, shareholderContacts, reminderContacts, sacrificeYear },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[email-recipients]", e);
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}
