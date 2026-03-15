import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/contact-messages - İletişim formu mesajını kaydeder
 */
export async function POST(req: Request) {
  try {
    const tenantId = getTenantId();
    const body = await req.json();

    const { name, phone, email, message } = body;

    if (!name || !phone || !message) {
      return NextResponse.json(
        { error: "Ad, telefon ve mesaj zorunludur" },
        { status: 400 }
      );
    }

    const messageYear = new Date().getFullYear();
    const { error } = await supabaseAdmin.from("contact_messages").insert({
      tenant_id: tenantId,
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: email ? String(email).trim() : null,
      message: String(message).trim(),
      message_year: messageYear,
    });

    if (error) {
      return NextResponse.json(
        { error: "Mesaj gönderilemedi" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Beklenmeyen hata" },
      { status: 500 }
    );
  }
}
