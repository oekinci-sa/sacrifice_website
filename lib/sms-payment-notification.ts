/**
 * Ödenen tutar güncellendiğinde `payment_amount_updated` şablonu ile SMS gönderir.
 * sms_enabled kapalıysa veya aktif şablon yoksa sessizce çıkar.
 */

import { getSmsCredentials } from "@/lib/sms-config";
import { sendSms } from "@/lib/sms-client";
import { normalizePhone } from "@/lib/sms-phone-normalizer";
import { buildSmsVariablesFromShareholderRow } from "@/lib/sms-template-variables";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { randomUUID } from "crypto";

function resolveTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{([a-z_]+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

export async function sendPaymentAmountUpdatedSms(opts: {
  tenantId: string;
  shareholderId: string;
  actorEmail: string;
}): Promise<void> {
  const { tenantId, shareholderId, actorEmail } = opts;

  const { data: settings } = await supabaseAdmin
    .from("tenant_settings")
    .select("sms_enabled, iban, deposit_amount, website_url, active_sacrifice_year")
    .eq("tenant_id", tenantId)
    .single();

  if (!settings?.sms_enabled) return;

  const { data: template } = await supabaseAdmin
    .from("sms_templates")
    .select("id, content")
    .eq("tenant_id", tenantId)
    .eq("event_key", "payment_amount_updated")
    .eq("is_active", true)
    .maybeSingle();

  if (!template?.content) return;

  const { data: row } = await supabaseAdmin
    .from("shareholders")
    .select(
      `shareholder_id, shareholder_name, phone_number, paid_amount, total_amount, remaining_payment,
       delivery_type, delivery_location, security_code, sacrifice_year, sacrifice_id,
       sacrifice:sacrifice_animals(sacrifice_no, sacrifice_time, ear_tag)`
    )
    .eq("tenant_id", tenantId)
    .eq("shareholder_id", shareholderId)
    .single();

  if (!row?.phone_number) return;

  const phone = normalizePhone(row.phone_number);
  if (!phone) return;

  const sacRaw = row.sacrifice as
    | { sacrifice_no: number; sacrifice_time: string | null; ear_tag: string | null }
    | { sacrifice_no: number; sacrifice_time: string | null; ear_tag: string | null }[]
    | null;
  const sac = Array.isArray(sacRaw) ? sacRaw[0] ?? null : sacRaw;

  const tenantBranding = {
    iban: settings.iban ?? "",
    deposit_amount: Number(settings.deposit_amount ?? 0),
    website_url: settings.website_url ?? null,
  };

  const vars = buildSmsVariablesFromShareholderRow(
    {
      shareholder_name: row.shareholder_name,
      phone_number: row.phone_number,
      paid_amount: row.paid_amount,
      total_amount: row.total_amount,
      remaining_payment: row.remaining_payment,
      delivery_type: row.delivery_type,
      delivery_location: row.delivery_location,
      security_code: row.security_code,
      sacrifice: sac
        ? {
            sacrifice_no: sac.sacrifice_no,
            sacrifice_time: sac.sacrifice_time,
            ear_tag: sac.ear_tag,
          }
        : null,
    },
    tenantBranding,
    tenantBranding.website_url ?? ""
  );

  const message = resolveTemplate(template.content, vars);
  const sacrificeYear =
    row.sacrifice_year ?? settings.active_sacrifice_year ?? new Date().getFullYear();

  const { data: sendRow, error: sendErr } = await supabaseAdmin
    .from("sms_sends")
    .insert({
      tenant_id: tenantId,
      template_id: template.id,
      title: "Otomatik: Ödeme tutarı güncellendi",
      message_content: template.content,
      target_type: "single",
      target_params: { event_key: "payment_amount_updated", shareholder_id: shareholderId },
      status: "sending",
      total_recipients: 1,
      sacrifice_year: sacrificeYear,
      idempotency_key: randomUUID(),
      provider: "bizimsms",
      created_by: actorEmail,
    })
    .select("id")
    .single();

  if (sendErr || !sendRow) {
    console.warn("[payment-sms] sms_sends insert failed:", sendErr?.message);
    return;
  }

  const sendId = sendRow.id;

  await supabaseAdmin.from("sms_send_recipients").insert({
    send_id: sendId,
    tenant_id: tenantId,
    shareholder_id: shareholderId,
    sacrifice_id: row.sacrifice_id,
    phone_number: phone,
    personalized_message: message,
    status: "queued",
  });

  const credentials = getSmsCredentials(tenantId);
  if (!credentials) {
    await supabaseAdmin
      .from("sms_sends")
      .update({
        status: "failed",
        failed_count: 1,
        completed_at: new Date().toISOString(),
      })
      .eq("id", sendId);
    return;
  }

  const result = await sendSms({
    credentials,
    messages: [{ phone, message }],
  });

  if (result.ok) {
    await supabaseAdmin
      .from("sms_sends")
      .update({
        status: "completed",
        sent_count: 1,
        completed_at: new Date().toISOString(),
      })
      .eq("id", sendId);
    await supabaseAdmin
      .from("sms_send_recipients")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("send_id", sendId);
  } else {
    await supabaseAdmin
      .from("sms_sends")
      .update({
        status: "failed",
        failed_count: 1,
        completed_at: new Date().toISOString(),
      })
      .eq("id", sendId);
    await supabaseAdmin
      .from("sms_send_recipients")
      .update({ status: "failed", error_code: result.code })
      .eq("send_id", sendId);
    console.warn("[payment-sms] send failed:", result.code, result.message);
  }
}
