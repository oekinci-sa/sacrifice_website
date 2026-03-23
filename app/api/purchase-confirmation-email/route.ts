import { buildPurchaseConfirmationHtml } from "@/lib/emails/purchase-confirmation-html";
import { normalizeEmail } from "@/lib/email-utils";
import {
  getResendForTenant,
  getResendFromEmailForTenant,
} from "@/lib/resend-client";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  transaction_id: z.string().min(8).max(32),
});

export async function POST(request: Request) {
  try {
    const tenantId = getTenantId();
    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
    }

    const { transaction_id } = parsed.data;

    const { data: claimed, error: claimError } = await supabaseAdmin
      .from("reservation_transactions")
      .update({
        purchase_confirmation_email_sent_at: new Date().toISOString(),
      })
      .eq("transaction_id", transaction_id)
      .eq("tenant_id", tenantId)
      .is("purchase_confirmation_email_sent_at", null)
      .eq("status", "completed")
      .select("transaction_id, sacrifice_id")
      .maybeSingle();

    if (claimError) {
      console.error("[purchase-confirmation-email] claim", claimError);
      return NextResponse.json({ error: "İşlem yapılamadı" }, { status: 500 });
    }

    if (!claimed) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const sacrificeId = claimed.sacrifice_id as string | null | undefined;
    if (!sacrificeId) {
      await clearSentFlag(tenantId, transaction_id);
      return NextResponse.json({ error: "Rezervasyon bulunamadı" }, { status: 404 });
    }

    const { data: tenantRow } = await supabaseAdmin
      .from("tenants")
      .select("name")
      .eq("id", tenantId)
      .single();

    const tenantName = (tenantRow?.name as string) || "Kurban Organizasyonu";

    const { data: sacrifice, error: sacErr } = await supabaseAdmin
      .from("sacrifice_animals")
      .select("sacrifice_no")
      .eq("sacrifice_id", sacrificeId)
      .eq("tenant_id", tenantId)
      .single();

    if (sacErr || !sacrifice) {
      await clearSentFlag(tenantId, transaction_id);
      return NextResponse.json({ error: "Kurban bilgisi alınamadı" }, { status: 500 });
    }

    const sacrificeNo = String(sacrifice.sacrifice_no ?? "");

    const { data: shareholders, error: shErr } = await supabaseAdmin
      .from("shareholders")
      .select("shareholder_name, email, security_code")
      .eq("tenant_id", tenantId)
      .eq("transaction_id", transaction_id);

    if (shErr) {
      await clearSentFlag(tenantId, transaction_id);
      return NextResponse.json({ error: "Hissedar bilgisi alınamadı" }, { status: 500 });
    }

    const rawRows = (shareholders ?? []).filter(
      (r) => (r.email as string | null | undefined)?.trim()
    );

    const seenAddr = new Set<string>();
    const rows: typeof rawRows = [];
    for (const r of rawRows) {
      const key = normalizeEmail((r.email as string).trim());
      if (seenAddr.has(key)) continue;
      seenAddr.add(key);
      rows.push(r);
    }

    if (rows.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, reason: "no_emails" });
    }

    const resend = getResendForTenant(tenantId);
    if (!resend) {
      await clearSentFlag(tenantId, transaction_id);
      return NextResponse.json(
        { error: "E-posta yapılandırması eksik (tenant Resend anahtarı)" },
        { status: 503 }
      );
    }

    const from = getResendFromEmailForTenant(tenantId);
    let sent = 0;

    for (const row of rows) {
      const email = (row.email as string).trim();
      const name = (row.shareholder_name as string) || "Hissedar";
      const code = (row.security_code as string) || "------";
      const { html, text } = buildPurchaseConfirmationHtml({
        tenantName,
        shareholderName: name,
        sacrificeNo,
        securityCode: code,
      });

      const { error } = await resend.emails.send({
        from,
        to: email,
        subject: `${tenantName} — Hisse kaydınız tamamlandı`,
        html,
        text,
      });

      if (error) {
        console.error("[purchase-confirmation-email] send", email, error);
        await clearSentFlag(tenantId, transaction_id);
        return NextResponse.json(
          { error: "Teşekkür e-postası gönderilemedi. Lütfen daha sonra tekrar deneyin." },
          { status: 502 }
        );
      }
      sent += 1;
    }

    return NextResponse.json({ ok: true, sent });
  } catch (e) {
    console.error("[purchase-confirmation-email]", e);
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}

async function clearSentFlag(tenantId: string, transaction_id: string) {
  await supabaseAdmin
    .from("reservation_transactions")
    .update({ purchase_confirmation_email_sent_at: null })
    .eq("transaction_id", transaction_id)
    .eq("tenant_id", tenantId);
}
