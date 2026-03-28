import { authOptions } from "@/lib/auth";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const allowedRoles = ["admin", "editor", "super_admin"];
    if (!session?.user || !allowedRoles.includes(session.user.role ?? "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = getTenantId();
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : null;

    let query = supabaseAdmin
      .from("reservation_transactions")
      .select("transaction_id", { count: "exact" })
      .eq("tenant_id", tenantId)
      .eq("status", "active");

    if (year != null && !Number.isNaN(year)) {
      query = query.eq("sacrifice_year", year);
    }

    const { count, error } = await query.limit(0);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch count" }, { status: 500 });
    }

    return NextResponse.json({ count: count ?? 0 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
