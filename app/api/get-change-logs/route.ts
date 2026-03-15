import { getTenantId } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId();
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : null;

    let query = supabaseAdmin
      .from("change_logs")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("changed_at", { ascending: false });

    if (year != null && !Number.isNaN(year)) {
      query = query.eq("sacrifice_year", year);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch change logs" },
        { status: 500 }
      );
    }

    // change_owner DB'de email olarak saklanır; users tablosu ile eşleştirip name göster
    // Loglardaki email benzeri değerleri topla (@ içeren)
    const emailsFromLogs = Array.from(new Set(
      (data || [])
        .map((log) => log.change_owner)
        .filter((v): v is string => typeof v === "string" && v.includes("@"))
    ));

    const { data: usersData } = emailsFromLogs.length > 0
      ? await supabaseAdmin.from("users").select("email, name").in("email", emailsFromLogs)
      : { data: [] };

    const emailToName = new Map(
      (usersData || []).filter((u) => u.email).map((u) => [u.email, u.name || u.email])
    );

    const logsWithFilteredOwner = (data || []).map((log) => ({
      ...log,
      change_owner: emailToName.has(log.change_owner) ? emailToName.get(log.change_owner) : null,
    }));

    return NextResponse.json({ logs: logsWithFilteredOwner }, {
      headers: { 
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 