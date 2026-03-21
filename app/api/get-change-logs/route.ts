import { editorDisplayFromRaw, buildEmailToEditorDisplayMap } from "@/lib/resolve-editor-display";
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
        { error: "Değişiklik kayıtları alınamadı" },
        { status: 500 }
      );
    }

    // DB'de change_owner = e-posta veya sistem etiketi; UI'da kullanıcı adı (yoksa e-posta / ham metin)
    const emailToDisplay = await buildEmailToEditorDisplayMap(
      supabaseAdmin,
      (data || []).map((log) => log.change_owner as string | null)
    );

    const logsWithDisplayOwner = (data || []).map((log) => ({
      ...log,
      change_owner: editorDisplayFromRaw(
        log.change_owner as string | null,
        emailToDisplay
      ) || null,
    }));

    return NextResponse.json({ logs: logsWithDisplayOwner }, {
      headers: { 
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch {
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
} 