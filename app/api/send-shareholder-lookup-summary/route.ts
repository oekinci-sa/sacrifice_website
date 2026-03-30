import {
  buildPurchaseConfirmationHtml,
  getPurchaseConfirmationTenantDisplayName,
} from "@/lib/emails/purchase-confirmation-html";
import { normalizeEmail } from "@/lib/email-utils";
import { buildPurchaseReceiptData } from "@/lib/purchase-receipt-data";
import { formatPhoneE164ForShareholderLookup } from "@/lib/shareholder-lookup-phone";
import { getResendForTenant, getResendFromForPurchaseConfirmation } from "@/lib/resend-client";
import { resolveSacrificeYearForTenant } from "@/lib/sacrifice-year-resolver";
import { getTenantBranding } from "@/lib/tenant-branding";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  phone: z.string().min(10).max(15),
  security_code: z.string().regex(/^\d{6}$/),
  shareholder_id: z.string().uuid(),
  alternate_email: z.string().email().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const tenantId = getTenantId();
    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz istek. Telefon, güvenlik kodu ve hissedar bilgilerini kontrol edin." },
        { status: 400 }
      );
    }

    const { phone, security_code, shareholder_id, alternate_email } = parsed.data;
    const formattedPhone = formatPhoneE164ForShareholderLookup(phone);

    const activeYear = await resolveSacrificeYearForTenant(tenantId, null);

    const { data: shareholdersRaw, error } = await supabaseAdmin
      .from("shareholders")
      .select(`
        *,
        sacrifice:sacrifice_animals (
          sacrifice_no,
          sacrifice_time,
          planned_delivery_time,
          share_price,
          share_weight,
          sacrifice_year,
          pricing_mode,
          live_scale_total_kg,
          live_scale_total_price
        )
      `)
      .eq("tenant_id", tenantId)
      .eq("phone_number", formattedPhone)
      .order("purchase_time", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Hissedar bilgileri alınamadı" },
        { status: 500 }
      );
    }

    const allShareholders = shareholdersRaw ?? [];
    if (allShareholders.length === 0) {
      return NextResponse.json(
        { error: "Bu telefon numarasına ait kayıt bulunamadı" },
        { status: 404 }
      );
    }

    const latestShareholderForCode = allShareholders[0];
    if (latestShareholderForCode.security_code !== security_code) {
      return NextResponse.json(
        { error: "Geçersiz güvenlik kodu" },
        { status: 401 }
      );
    }

    const shareholders = allShareholders.filter(
      (sh) =>
        (sh.sacrifice as { sacrifice_year?: number } | null)?.sacrifice_year ===
        activeYear
    );

    const row = shareholders.find((sh) => sh.shareholder_id === shareholder_id);
    if (!row) {
      return NextResponse.json(
        { error: "Bu yıla ait hissedar kaydı bulunamadı" },
        { status: 404 }
      );
    }

    const dbEmailRaw = (row.email as string | null | undefined)?.trim() ?? "";
    const altRaw = alternate_email?.trim() ?? "";

    let to: string;
    if (altRaw) {
      to = normalizeEmail(altRaw);
    } else if (dbEmailRaw) {
      to = normalizeEmail(dbEmailRaw);
    } else {
      return NextResponse.json(
        {
          error:
            "Kayıtlı e-posta adresiniz yok. Göndermek istediğiniz adresi girin.",
          code: "EMAIL_REQUIRED",
        },
        { status: 400 }
      );
    }

    const resend = getResendForTenant(tenantId);
    if (!resend) {
      return NextResponse.json(
        { error: "E-posta servisi şu anda kullanılamıyor" },
        { status: 503 }
      );
    }

    const branding = await getTenantBranding();
    const tenantDisplayName = getPurchaseConfirmationTenantDisplayName(
      branding.logo_slug
    );

    const txId = (row.transaction_id as string | null | undefined) ?? null;
    let reservationCreatedAt: string | null =
      (row.purchase_time as string | null) ?? null;
    if (txId) {
      const { data: rt } = await supabaseAdmin
        .from("reservation_transactions")
        .select("created_at")
        .eq("tenant_id", tenantId)
        .eq("transaction_id", txId)
        .maybeSingle();
      if (rt?.created_at) {
        reservationCreatedAt = rt.created_at as string;
      }
    }

    const sacrifice = row.sacrifice as Parameters<
      typeof buildPurchaseReceiptData
    >[1];
    const receipt = buildPurchaseReceiptData(
      row,
      sacrifice,
      { created_at: reservationCreatedAt },
      txId ?? "----------------",
      branding
    );

    const { html, text } = buildPurchaseConfirmationHtml({
      tenantName: tenantDisplayName,
      branding,
      receipt,
    });

    const from = getResendFromForPurchaseConfirmation(tenantId);

    const { error: sendErr } = await resend.emails.send({
      from,
      to: [to],
      subject: `${tenantDisplayName} — Hisse kaydınız tamamlandı`,
      html,
      text,
    });

    if (sendErr) {
      console.error("[send-shareholder-lookup-summary]", sendErr);
      return NextResponse.json(
        { error: "E-posta gönderilemedi. Lütfen daha sonra tekrar deneyin." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, sent_to: to });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
