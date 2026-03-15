import { getDefaultSacrificeYear } from "@/lib/constants/sacrifice-year";
import { getTenantIdOptional } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * POST /api/reminder-requests - Yeni "bana haber ver" kaydı
 */
export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdOptional();
    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant bulunamadı. Lütfen doğru adresle (localhost:3000, 3001 veya 3002) tekrar deneyin." },
        { status: 400 }
      );
    }
    const body = await request.json();
    const { name, phone } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "İsim ve telefon numarası zorunludur." },
        { status: 400 }
      );
    }

    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length !== 11 || !phoneDigits.startsWith("05")) {
      return NextResponse.json(
        { error: "Geçerli bir telefon numarası giriniz (05XX XXX XX XX)" },
        { status: 400 }
      );
    }

    const sacrificeYear = getDefaultSacrificeYear();
    const { data, error } = await supabaseAdmin
      .from("reminder_requests")
      .insert({
        tenant_id: tenantId,
        name: name.trim(),
        phone: phoneDigits,
        sacrifice_year: sacrificeYear,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "already_exists", message: "Bu numara daha önce kaydedilmiş." },
          { status: 409 }
        );
      }
      console.error("reminder_requests insert error:", error);
      return NextResponse.json(
        { error: "Kayıt sırasında bir hata oluştu." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("reminder-requests POST error:", err);
    return NextResponse.json(
      { error: "Kayıt sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}
