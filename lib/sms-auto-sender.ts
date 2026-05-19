/**
 * Otomatik SMS gönderim motoru.
 *
 * update-sacrifice-timing başarılı olduğunda çağrılır.
 * sms_auto_enabled kapalıysa veya şablon yoksa sessizce çıkar.
 * Hata hiçbir zaman çağıran route'u bloklamaz — caller .catch(err => ...) kullanır.
 */

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSmsCredentials } from "@/lib/sms-config";
import { sendSms } from "@/lib/sms-client";
import { normalizePhone } from "@/lib/sms-phone-normalizer";
import { buildSmsVariablesFromShareholderRow } from "@/lib/sms-template-variables";
export type StageType = "slaughter_stage" | "butcher_stage" | "delivery_stage";

export type EventKey =
  | "slaughter_approaching"
  | "slaughter_completed"
  | "butcher_started"
  | "delivery_pickup_approaching"
  | "external_delivery_notice";

interface AutoSmsParams {
  tenantId: string;
  sacrificeYear: number;
  sacrificeNo: number;
  stage: StageType;
  isCompleted: boolean;
}

/** Deterministik idempotency anahtarı: auto:{event}:{tenant}:{sacrifice_id}:{year} */
function buildIdempotencyKey(
  eventKey: EventKey,
  tenantId: string,
  sacrificeId: string,
  sacrificeYear: number
): string {
  return `auto:${eventKey}:${tenantId}:${sacrificeId}:${sacrificeYear}`;
}

/** Hissedar satırı için SMS metnini değişken doldurarak üretir. */
function resolveTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{([a-z_]+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

function isKesimhane(deliveryType: string | null | undefined): boolean {
  return (deliveryType ?? "").trim().toLocaleLowerCase("tr") === "kesimhane";
}

/** Kesim/parçalama/teslimat için ortalama süre (saniye). */
async function fetchAvgDuration(
  tenantId: string,
  _sacrificeYear: number,
  stage: StageType
): Promise<number> {
  const { data } = await supabaseAdmin
    .from("stage_metrics")
    .select("avg_progress_duration")
    .eq("tenant_id", tenantId)
    .eq("stage", stage)
    .single();
  return data?.avg_progress_duration ?? 0;
}

/** Verilen kurbanlık numarası için hissedarları getirir. */
async function fetchShareholders(
  tenantId: string,
  sacrificeYear: number,
  sacrificeNo: number
) {
  const { data: animal } = await supabaseAdmin
    .from("sacrifice_animals")
    .select("sacrifice_id")
    .eq("tenant_id", tenantId)
    .eq("sacrifice_no", sacrificeNo)
    .eq("sacrifice_year", sacrificeYear)
    .single();

  if (!animal) return [];

  const { data: rows } = await supabaseAdmin
    .from("shareholders")
    .select(
      "shareholder_id, shareholder_name, phone_number, delivery_type, delivery_location, paid_amount, total_amount, remaining_payment, security_code, sacrifice_id"
    )
    .eq("tenant_id", tenantId)
    .eq("sacrifice_year", sacrificeYear)
    .eq("sacrifice_id", animal.sacrifice_id);

  return (rows ?? []).map((r) => ({
    ...r,
    sacrifice: { sacrifice_no: sacrificeNo, sacrifice_time: null, ear_tag: null },
  }));
}

/** Daha önce bu event gönderilmiş hissedar ID'lerini döner. */
async function fetchAlreadySentIds(
  tenantId: string,
  sacrificeYear: number,
  shareholderIds: string[],
  eventKey: EventKey
): Promise<Set<string>> {
  if (shareholderIds.length === 0) return new Set();

  const { data } = await supabaseAdmin
    .from("sms_notification_events")
    .select("shareholder_id")
    .eq("tenant_id", tenantId)
    .eq("sacrifice_year", sacrificeYear)
    .eq("event_key", eventKey)
    .in("shareholder_id", shareholderIds);

  return new Set((data ?? []).map((r) => r.shareholder_id));
}

/** Hedef kurbanlığın ilgili aşaması tamamlanmış mı? Tamamlanmışsa SMS atma. */
async function isSacrificeStageAlreadyDone(
  tenantId: string,
  sacrificeYear: number,
  sacrificeNo: number,
  timeField: "slaughter_time" | "delivery_time"
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("sacrifice_animals")
    .select(timeField)
    .eq("tenant_id", tenantId)
    .eq("sacrifice_no", sacrificeNo)
    .eq("sacrifice_year", sacrificeYear)
    .single();

  if (!data) return true;
  return (data as Record<string, unknown>)[timeField] != null;
}

interface SendEventResult {
  sendId: string | null;
}

/**
 * Bir event için SMS gönderir; idempotency kaydı oluşturur.
 * Alıcı yoksa veya şablon yoksa sessizce atlar.
 */
async function sendEventSms(opts: {
  tenantId: string;
  sacrificeYear: number;
  eventKey: EventKey;
  sacrificeId: string;
  recipients: Array<{
    shareholder_id: string;
    phone_number: string | null;
    shareholder_name: string | null;
    delivery_type: string | null;
    delivery_location: string | null;
    paid_amount: number | null;
    total_amount: number | null;
    remaining_payment: number | null;
    security_code: string | null;
    sacrifice: { sacrifice_no: number; sacrifice_time: string | null; ear_tag: string | null };
  }>;
  templateContent: string;
  templateId: string;
  websiteUrl: string | null;
  tenantBranding: { iban: string; deposit_amount: number; website_url: string | null };
  context: { triggered_sacrifice_no?: number; estimated_minutes?: number };
}): Promise<SendEventResult> {
  const { tenantId, sacrificeYear, eventKey, sacrificeId, recipients, templateContent, templateId, tenantBranding, context } = opts;

  if (recipients.length === 0) return { sendId: null };

  // Her alıcı için mesaj hazırla ve geçerli telefon seç
  const messages: Array<{ phone: string; message: string; shareholderId: string }> = [];

  for (const r of recipients) {
    const phone = normalizePhone(r.phone_number);
    if (!phone) continue;

    const vars = buildSmsVariablesFromShareholderRow(
      {
        shareholder_name: r.shareholder_name,
        phone_number: r.phone_number,
        paid_amount: r.paid_amount,
        total_amount: r.total_amount,
        remaining_payment: r.remaining_payment,
        delivery_type: r.delivery_type,
        delivery_location: r.delivery_location,
        security_code: r.security_code,
        sacrifice: r.sacrifice,
      },
      tenantBranding,
      tenantBranding.website_url ?? "",
      context
    );

    messages.push({
      phone,
      message: resolveTemplate(templateContent, vars),
      shareholderId: r.shareholder_id,
    });
  }

  if (messages.length === 0) return { sendId: null };

  // sms_sends kaydı oluştur
  const { data: sendRow, error: sendErr } = await supabaseAdmin
    .from("sms_sends")
    .insert({
      tenant_id: tenantId,
      template_id: templateId,
      title: `Otomatik: ${eventKey}`,
      message_content: templateContent,
      target_type: "custom",
      target_params: { event_key: eventKey, sacrifice_id: sacrificeId },
      status: "sending",
      total_recipients: messages.length,
      sacrifice_year: sacrificeYear,
      idempotency_key: buildIdempotencyKey(eventKey, tenantId, sacrificeId, sacrificeYear),
      provider: "bizimsms",
      created_by: "Sistem (Otomatik)",
    })
    .select("id")
    .single();

  if (sendErr || !sendRow) {
    // Unique ihlali = daha önce gönderilmiş; sessizce atla
    console.warn("[auto-sms] sms_sends insert skipped:", sendErr?.code, sendErr?.message);
    return { sendId: null };
  }

  const sendId: string = sendRow.id;

  // Alıcıları kaydet
  const recipientRows = messages.map((m) => ({
    send_id: sendId,
    tenant_id: tenantId,
    shareholder_id: m.shareholderId,
    sacrifice_id: sacrificeId,
    phone_number: m.phone,
    personalized_message: m.message,
    status: "queued",
  }));

  await supabaseAdmin.from("sms_send_recipients").insert(recipientRows);

  // SMS gönder
  const credentials = getSmsCredentials(tenantId);
  if (!credentials) {
    await supabaseAdmin
      .from("sms_sends")
      .update({ status: "failed", failed_count: messages.length, completed_at: new Date().toISOString() })
      .eq("id", sendId);
    console.error("[auto-sms] SMS credentials not found for tenant", tenantId);
    return { sendId };
  }

  const result = await sendSms({
    credentials,
    messages: messages.map((m) => ({ phone: m.phone, message: m.message })),
  });

  if (result.ok) {
    await supabaseAdmin
      .from("sms_sends")
      .update({
        status: "completed",
        sent_count: messages.length,
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
        failed_count: messages.length,
        completed_at: new Date().toISOString(),
      })
      .eq("id", sendId);
    await supabaseAdmin
      .from("sms_send_recipients")
      .update({ status: "failed", error_code: result.code })
      .eq("send_id", sendId);
    console.error("[auto-sms] SMS send failed:", result.code, result.message);
  }

  return { sendId };
}

/**
 * Bir event için hedef hissedarları filtreler, idempotency kontrol eder ve SMS gönderir.
 */
async function fireEvent(opts: {
  eventKey: EventKey;
  tenantId: string;
  sacrificeYear: number;
  targetSacrificeNo: number;
  deliveryFilter: "kesimhane_only" | "external_only" | "all";
  templateContent: string;
  templateId: string;
  tenantBranding: { iban: string; deposit_amount: number; website_url: string | null };
  sacrificeId: string;
  context: { triggered_sacrifice_no?: number; estimated_minutes?: number };
}): Promise<void> {
  const {
    eventKey, tenantId, sacrificeYear, targetSacrificeNo,
    deliveryFilter, templateContent, templateId, tenantBranding, sacrificeId, context,
  } = opts;

  const allRecipients = await fetchShareholders(tenantId, sacrificeYear, targetSacrificeNo);
  if (allRecipients.length === 0) return;

  // delivery_type filtresi
  const filtered = allRecipients.filter((r) => {
    if (deliveryFilter === "kesimhane_only") return isKesimhane(r.delivery_type);
    if (deliveryFilter === "external_only") return !isKesimhane(r.delivery_type);
    return true;
  });
  if (filtered.length === 0) return;

  // idempotency: zaten gönderilenleri çıkar
  const alreadySent = await fetchAlreadySentIds(
    tenantId,
    sacrificeYear,
    filtered.map((r) => r.shareholder_id),
    eventKey
  );
  const pending = filtered.filter((r) => !alreadySent.has(r.shareholder_id));
  if (pending.length === 0) return;

  const { sendId } = await sendEventSms({
    tenantId,
    sacrificeYear,
    eventKey,
    sacrificeId,
    recipients: pending,
    templateContent,
    templateId,
    websiteUrl: tenantBranding.website_url,
    tenantBranding,
    context,
  });

  // sms_notification_events kaydı — hata fırlatsa bile idempotency için yaz
  const notifRows = pending.map((r) => ({
    tenant_id: tenantId,
    sacrifice_year: sacrificeYear,
    sacrifice_id: sacrificeId,
    shareholder_id: r.shareholder_id,
    event_key: eventKey,
    send_id: sendId ?? null,
  }));

  const { error: notifErr } = await supabaseAdmin
    .from("sms_notification_events")
    .upsert(notifRows, {
      onConflict: "tenant_id,sacrifice_year,shareholder_id,event_key",
      ignoreDuplicates: true,
    });

  if (notifErr) {
    console.error("[auto-sms] sms_notification_events insert error:", notifErr.message);
  }
}

/**
 * Bir sacrifice aşaması switch'i açıldığında otomatik SMS tetikler.
 * Hata fırlatmaz — caller .catch() ile loglar.
 */
export async function handleAutoSms(params: AutoSmsParams): Promise<void> {
  const { tenantId, sacrificeYear, sacrificeNo, stage, isCompleted } = params;

  if (!isCompleted) return;

  // 1. Tenant ayarları: sms_auto_enabled + offset'ler
  const { data: settings } = await supabaseAdmin
    .from("tenant_settings")
    .select("sms_auto_enabled, sms_slaughter_approach_offset, sms_delivery_pickup_offset, sms_enabled, iban, deposit_amount, website_url")
    .eq("tenant_id", tenantId)
    .single();

  if (!settings?.sms_auto_enabled || !settings?.sms_enabled) return;

  const slaughterOffset: number = settings.sms_slaughter_approach_offset ?? 20;
  const deliveryOffset: number = settings.sms_delivery_pickup_offset ?? 2;

  const tenantBranding = {
    iban: settings.iban ?? "",
    deposit_amount: Number(settings.deposit_amount ?? 0),
    website_url: settings.website_url ?? null,
  };

  // 2. Tetiklenen kurbanlığın UUID'si
  const { data: animalRow } = await supabaseAdmin
    .from("sacrifice_animals")
    .select("sacrifice_id")
    .eq("tenant_id", tenantId)
    .eq("sacrifice_no", sacrificeNo)
    .eq("sacrifice_year", sacrificeYear)
    .single();

  if (!animalRow) return;
  const currentSacrificeId: string = animalRow.sacrifice_id;

  // 3. Aktif şablonları bir kerede çek (bu tenant için)
  const { data: templates } = await supabaseAdmin
    .from("sms_templates")
    .select("id, event_key, content")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .not("event_key", "is", null);

  const templateMap = new Map(
    (templates ?? []).map((t) => [t.event_key as EventKey, { id: t.id, content: t.content }])
  );

  // ── Kesim aşaması ───────────────────────────────────────────────────────────
  if (stage === "slaughter_stage") {
    const avgSeconds = await fetchAvgDuration(tenantId, sacrificeYear, "slaughter_stage");
    const avgSlaughterMinutes = avgSeconds > 0 ? avgSeconds / 60 : 0;

    // SMS-1: slaughter_approaching → sacrifice_no + offset, sadece Kesimhane
    const approachTpl = templateMap.get("slaughter_approaching");
    if (approachTpl) {
      const targetNo = sacrificeNo + slaughterOffset;
      const alreadyDone = await isSacrificeStageAlreadyDone(
        tenantId, sacrificeYear, targetNo, "slaughter_time"
      );
      if (!alreadyDone) {
        // Hedef kurban var mı?
        const { data: targetAnimal } = await supabaseAdmin
          .from("sacrifice_animals")
          .select("sacrifice_id")
          .eq("tenant_id", tenantId)
          .eq("sacrifice_no", targetNo)
          .eq("sacrifice_year", sacrificeYear)
          .single();

        if (targetAnimal) {
          await fireEvent({
            eventKey: "slaughter_approaching",
            tenantId,
            sacrificeYear,
            targetSacrificeNo: targetNo,
            deliveryFilter: "kesimhane_only",
            templateContent: approachTpl.content,
            templateId: approachTpl.id,
            tenantBranding,
            sacrificeId: targetAnimal.sacrifice_id,
            context: {
              triggered_sacrifice_no: sacrificeNo,
              avg_slaughter_minutes: avgSlaughterMinutes,
              slaughter_offset: slaughterOffset,
            },
          });
        }
      }
    }

    // SMS-2: slaughter_completed → aynı kurban, tüm hissedarlar
    const completedTpl = templateMap.get("slaughter_completed");
    if (completedTpl) {
      await fireEvent({
        eventKey: "slaughter_completed",
        tenantId,
        sacrificeYear,
        targetSacrificeNo: sacrificeNo,
        deliveryFilter: "all",
        templateContent: completedTpl.content,
        templateId: completedTpl.id,
        tenantBranding,
        sacrificeId: currentSacrificeId,
        context: {
          triggered_sacrifice_no: sacrificeNo,
          avg_slaughter_minutes: avgSlaughterMinutes,
          slaughter_offset: slaughterOffset,
        },
      });
    }
  }

  // ── Parçalama aşaması ───────────────────────────────────────────────────────
  if (stage === "butcher_stage") {
    const avgSeconds = await fetchAvgDuration(tenantId, sacrificeYear, "butcher_stage");
    const avgButcherMinutes = avgSeconds > 0 ? avgSeconds / 60 : 0;

    // SMS-3: butcher_started → aynı kurban, sadece Kesimhane
    const butcherTpl = templateMap.get("butcher_started");
    if (butcherTpl) {
      await fireEvent({
        eventKey: "butcher_started",
        tenantId,
        sacrificeYear,
        targetSacrificeNo: sacrificeNo,
        deliveryFilter: "kesimhane_only",
        templateContent: butcherTpl.content,
        templateId: butcherTpl.id,
        tenantBranding,
        sacrificeId: currentSacrificeId,
        context: {
          triggered_sacrifice_no: sacrificeNo,
          avg_butcher_minutes: avgButcherMinutes,
        },
      });
    }
  }

  // ── Teslimat aşaması ────────────────────────────────────────────────────────
  if (stage === "delivery_stage") {
    const avgSeconds = await fetchAvgDuration(tenantId, sacrificeYear, "delivery_stage");
    const avgDeliveryMinutes = avgSeconds > 0 ? avgSeconds / 60 : 0;

    // SMS-4: delivery_pickup_approaching → sacrifice_no + offset, sadece Kesimhane
    const pickupTpl = templateMap.get("delivery_pickup_approaching");
    if (pickupTpl) {
      const targetNo = sacrificeNo + deliveryOffset;
      const alreadyDone = await isSacrificeStageAlreadyDone(
        tenantId, sacrificeYear, targetNo, "delivery_time"
      );
      if (!alreadyDone) {
        const { data: targetAnimal } = await supabaseAdmin
          .from("sacrifice_animals")
          .select("sacrifice_id")
          .eq("tenant_id", tenantId)
          .eq("sacrifice_no", targetNo)
          .eq("sacrifice_year", sacrificeYear)
          .single();

        if (targetAnimal) {
          await fireEvent({
            eventKey: "delivery_pickup_approaching",
            tenantId,
            sacrificeYear,
            targetSacrificeNo: targetNo,
            deliveryFilter: "kesimhane_only",
            templateContent: pickupTpl.content,
            templateId: pickupTpl.id,
            tenantBranding,
            sacrificeId: targetAnimal.sacrifice_id,
            context: {
              triggered_sacrifice_no: sacrificeNo,
              avg_delivery_minutes: avgDeliveryMinutes,
              delivery_offset: deliveryOffset,
            },
          });
        }
      }
    }

    // SMS-5: external_delivery_notice → aynı kurban, sadece Kesimhane dışı
    const extTpl = templateMap.get("external_delivery_notice");
    if (extTpl) {
      await fireEvent({
        eventKey: "external_delivery_notice",
        tenantId,
        sacrificeYear,
        targetSacrificeNo: sacrificeNo,
        deliveryFilter: "external_only",
        templateContent: extTpl.content,
        templateId: extTpl.id,
        tenantBranding,
        sacrificeId: currentSacrificeId,
        context: {
          triggered_sacrifice_no: sacrificeNo,
          avg_delivery_minutes: avgDeliveryMinutes,
          delivery_offset: deliveryOffset,
        },
      });
    }
  }
}
