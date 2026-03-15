import { getTenantIdOptional } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/reminder-requests/check?phone=05XXXXXXXXX - Telefon daha önce kaydedilmiş mi?
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdOptional();
    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant bulunamadı.", exists: false },
        { status: 400 }
      );
    }
    const phone = request.nextUrl.searchParams.get("phone");

    if (!phone) {
      return NextResponse.json(
        { error: "Telefon numarası gerekli." },
        { status: 400 }
      );
    }

    const phoneDigits = phone.replace(/\D/g, "");

    const { data, error } = await supabaseAdmin
      .from("reminder_requests")
      .select("id, created_at")
      .eq("tenant_id", tenantId)
      .eq("phone", phoneDigits)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Kontrol sırasında hata oluştu." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exists: !!data,
      createdAt: data?.created_at ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Sunucu hatası." },
      { status: 500 }
    );
  }
}
