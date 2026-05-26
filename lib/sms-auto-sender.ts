/**
 * Otomatik SMS gönderim motoru.
 *
 * update-sacrifice-timing başarılı olduğunda çağrılır.
 * sms_auto_enabled kapalıysa veya şablon yoksa sessizce çıkar.
 * Hata hiçbir zaman çağıran route'u bloklamaz — caller .catch(err => ...) kullanır.
 */

import { randomUUID } from "crypto";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSmsCredentials } from "@/lib/sms-config";
import { sendSms } from "@/lib/sms-client";
import { normalizePhone } from "@/lib/sms-phone-normalizer";
import { SMS_STAGE_AUTO_EVENT_KEYS } from "@/lib/sms-event-keys";
import {
  buildSmsVariablesFromShareholderRow,
  type AutoSmsContext,
} from "@/lib/sms-template-variables";

export type StageType = "slaughter_stage" | "butcher_stage" | "delivery_stage";

/** Kurban günü otomatik SMS event anahtarları (ödeme hariç). */
export type EventKey = (typeof SMS_STAGE_AUTO_EVENT_KEYS)[number];

interface AutoSmsParams {
  tenantId: string;
  sacrificeYear: number;
  sacrificeNo: number;
  stage: StageType;
  isCompleted: boolean;
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

/**
 * Parçalama→Teslimat ortalama bekleme süresi (dakika).
 *
 * Her tamamlanmış hayvan için:
 *   süre = delivery_time(N) − butcher_time(N−1)
 *
 * Yani N numaralı hayvanın parçalamaya giriş zamanı, N−1'in butcher_time'ıdır.
 * Yalnızca hedef kurbandan önceki, hem önceki hayvanın butcher_time'ı
 * hem de kendi delivery_time'ı dolu olan çiftler dahil edilir.
 */
async function fetchAvgParcalamaTeslimatMinutes(
  tenantId: string,
  sacrificeYear: number,
  beforeSacrificeNo: number
): Promise<number | undefined> {
  const { data, error } = await supabaseAdmin
    .from("sacrifice_animals")
    .select("sacrifice_no, delivery_time")
    .eq("tenant_id", tenantId)
    .eq("sacrifice_year", sacrificeYear)
    .lt("sacrifice_no", beforeSacrificeNo)
    .not("delivery_time", "is", null)
    .order("sacrifice_no", { ascending: true });

  if (error || !data || data.length === 0) return undefined;

  // Önceki hayvanın butcher_time'ına ihtiyaç var; toplu çek
  const nos = data.map((r) => r.sacrifice_no - 1).filter((n) => n > 0);
  if (nos.length === 0) return undefined;

  const { data: prevData, error: prevErr } = await supabaseAdmin
    .from("sacrifice_animals")
    .select("sacrifice_no, butcher_time")
    .eq("tenant_id", tenantId)
    .eq("sacrifice_year", sacrificeYear)
    .in("sacrifice_no", nos)
    .not("butcher_time", "is", null);

  if (prevErr || !prevData || prevData.length === 0) return undefined;

  const prevMap = new Map(prevData.map((r) => [r.sacrifice_no, r.butcher_time as string]));

  let totalMs = 0;
  let count = 0;

  for (const cur of data) {
    const prevButcherTime = prevMap.get(cur.sacrifice_no - 1);
    if (!prevButcherTime || !cur.delivery_time) continue;
    const diff = new Date(cur.delivery_time as string).getTime() - new Date(prevButcherTime).getTime();
    if (diff > 0) {
      totalMs += diff;
      count++;
    }
  }

  if (count === 0) return undefined;
  return totalMs / count / 60_000; // ms → dakika
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
 * Bir event için SMS gönderir.
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
  context: AutoSmsContext;
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
      idempotency_key: randomUUID(),
      provider: "bizimsms",
      created_by: "Sistem (Otomatik)",
    })
    .select("id")
    .single();

  if (sendErr || !sendRow) {
    console.error("[auto-sms] sms_sends insert failed:", sendErr?.code, sendErr?.message);
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

/** Bir event için hedef hissedarları filtreler ve SMS gönderir. */
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
  context: AutoSmsContext;
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

  const { sendId } = await sendEventSms({
    tenantId,
    sacrificeYear,
    eventKey,
    sacrificeId,
    recipients: filtered,
    templateContent,
    templateId,
    websiteUrl: tenantBranding.website_url,
    tenantBranding,
    context,
  });

  // Son gönderim referansı (tekrar engeli yok; yalnızca audit)
  const notifRows = filtered.map((r) => ({
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
    });

  if (notifErr) {
    console.error("[auto-sms] sms_notification_events insert error:", notifErr.message);
  }
}

/** DB recipient_scope → fireEvent deliveryFilter dönüşümü. */
function toDeliveryFilter(
  scope: string
): "kesimhane_only" | "external_only" | "all" {
  if (scope === "slaughterhouse_only") return "kesimhane_only";
  if (scope === "external_only") return "external_only";
  return "all";
}

/** Per-event ayarları için güvenli default değerler. */
const EVENT_DEFAULTS: Record<
  EventKey,
  { target_offset: number | null; recipient_scope: string; skip_if_target_missing: boolean; skip_if_target_completed: boolean }
> = {
  slaughter_approaching: { target_offset: 20,   recipient_scope: "slaughterhouse_only", skip_if_target_missing: true,  skip_if_target_completed: true },
  slaughter_imminent:   { target_offset: 3,    recipient_scope: "slaughterhouse_only", skip_if_target_missing: true,  skip_if_target_completed: true },
  slaughter_completed:  { target_offset: null, recipient_scope: "all",                 skip_if_target_missing: false, skip_if_target_completed: false },
  butcher_started:      { target_offset: null, recipient_scope: "slaughterhouse_only", skip_if_target_missing: true,  skip_if_target_completed: true },
  delivery_completed:   { target_offset: null, recipient_scope: "all",                 skip_if_target_missing: false, skip_if_target_completed: false },
};

/**
 * Bir sacrifice aşaması switch'i açıldığında otomatik SMS tetikler.
 * Hata fırlatmaz — caller .catch() ile loglar.
 */
export async function handleAutoSms(params: AutoSmsParams): Promise<void> {
  const { tenantId, sacrificeYear, sacrificeNo, stage, isCompleted } = params;

  if (!isCompleted) return;

  // 1. Tenant master switch + branding bilgileri
  const { data: settings } = await supabaseAdmin
    .from("tenant_settings")
    .select(
      "sms_auto_enabled, sms_enabled, iban, deposit_amount, website_url, sms_delivery_pickup_offset"
    )
    .eq("tenant_id", tenantId)
    .single();

  if (!settings?.sms_auto_enabled || !settings?.sms_enabled) return;

  const tenantBranding = {
    iban: settings.iban ?? "",
    deposit_amount: Number(settings.deposit_amount ?? 0),
    website_url: settings.website_url ?? null,
  };

  // 2. Per-event gönderim kurallarını çek
  const { data: eventSettingsRows } = await supabaseAdmin
    .from("sms_auto_event_settings")
    .select(
      "event_key, target_offset, recipient_scope, skip_if_target_missing, skip_if_target_completed"
    )
    .eq("tenant_id", tenantId);

  const eventSettingsMap = new Map(
    (eventSettingsRows ?? []).map((r) => [r.event_key as EventKey, r])
  );

  /** Event ayarını döner; kayıt yoksa safe default kullanır. */
  function getEventSettings(key: EventKey) {
    const db = eventSettingsMap.get(key);
    const def = EVENT_DEFAULTS[key];
    return {
      target_offset:            db?.target_offset            ?? def.target_offset,
      recipient_scope:          db?.recipient_scope          ?? def.recipient_scope,
      skip_if_target_missing:   db?.skip_if_target_missing   ?? def.skip_if_target_missing,
      skip_if_target_completed: db?.skip_if_target_completed ?? def.skip_if_target_completed,
    };
  }

  // 3. Tetiklenen kurbanlığın UUID'si
  const { data: animalRow } = await supabaseAdmin
    .from("sacrifice_animals")
    .select("sacrifice_id")
    .eq("tenant_id", tenantId)
    .eq("sacrifice_no", sacrificeNo)
    .eq("sacrifice_year", sacrificeYear)
    .single();

  if (!animalRow) return;
  const currentSacrificeId: string = animalRow.sacrifice_id;

  // 4. Aktif şablonları bir kerede çek (bu tenant için)
  const { data: templates } = await supabaseAdmin
    .from("sms_templates")
    .select("id, event_key, content, content_external")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .not("event_key", "is", null);

  const templateMap = new Map(
    (templates ?? []).map((t) => [
      t.event_key as EventKey,
      {
        id: t.id,
        content: t.content,
        content_external: (t as { content_external?: string | null }).content_external ?? null,
      },
    ])
  );

  // ── Kesim aşaması ───────────────────────────────────────────────────────────
  if (stage === "slaughter_stage") {
    const avgSeconds = await fetchAvgDuration(tenantId, sacrificeYear, "slaughter_stage");
    const avgSlaughterMinutes = avgSeconds > 0 ? avgSeconds / 60 : 0;

    // SMS-1: slaughter_approaching
    const approachTpl = templateMap.get("slaughter_approaching");
    if (approachTpl) {
      const s = getEventSettings("slaughter_approaching");
      const offset = s.target_offset ?? EVENT_DEFAULTS.slaughter_approaching.target_offset ?? 20;
      const targetNo = sacrificeNo + offset;

      let shouldSend = true;

      {
        const { data: targetAnimalCheck } = await supabaseAdmin
          .from("sacrifice_animals").select("sacrifice_id")
          .eq("tenant_id", tenantId).eq("sacrifice_no", targetNo).eq("sacrifice_year", sacrificeYear)
          .single();
        if (!targetAnimalCheck) shouldSend = false;
      }

      if (shouldSend) {
        const alreadyDone = await isSacrificeStageAlreadyDone(tenantId, sacrificeYear, targetNo, "slaughter_time");
        if (alreadyDone) shouldSend = false;
      }

      if (shouldSend) {
        const { data: targetAnimal } = await supabaseAdmin
          .from("sacrifice_animals").select("sacrifice_id")
          .eq("tenant_id", tenantId).eq("sacrifice_no", targetNo).eq("sacrifice_year", sacrificeYear)
          .single();
        if (targetAnimal) {
          await fireEvent({
            eventKey: "slaughter_approaching",
            tenantId, sacrificeYear,
            targetSacrificeNo: targetNo,
            deliveryFilter: toDeliveryFilter(s.recipient_scope),
            templateContent: approachTpl.content,
            templateId: approachTpl.id,
            tenantBranding,
            sacrificeId: targetAnimal.sacrifice_id,
            context: { triggered_sacrifice_no: sacrificeNo, avg_slaughter_minutes: avgSlaughterMinutes, slaughter_offset: offset },
          });
        }
      }
    }

    // SMS-1b: slaughter_imminent (daha yakın sıradaki kurbanlık)
    const imminentTpl = templateMap.get("slaughter_imminent");
    if (imminentTpl) {
      const s = getEventSettings("slaughter_imminent");
      const offset = s.target_offset ?? EVENT_DEFAULTS.slaughter_imminent.target_offset ?? 3;
      const targetNo = sacrificeNo + offset;

      let shouldSend = true;

      {
        const { data: targetAnimalCheck } = await supabaseAdmin
          .from("sacrifice_animals").select("sacrifice_id")
          .eq("tenant_id", tenantId).eq("sacrifice_no", targetNo).eq("sacrifice_year", sacrificeYear)
          .single();
        if (!targetAnimalCheck) shouldSend = false;
      }

      if (shouldSend) {
        const alreadyDone = await isSacrificeStageAlreadyDone(tenantId, sacrificeYear, targetNo, "slaughter_time");
        if (alreadyDone) shouldSend = false;
      }

      if (shouldSend) {
        const { data: targetAnimal } = await supabaseAdmin
          .from("sacrifice_animals").select("sacrifice_id")
          .eq("tenant_id", tenantId).eq("sacrifice_no", targetNo).eq("sacrifice_year", sacrificeYear)
          .single();
        if (targetAnimal) {
          await fireEvent({
            eventKey: "slaughter_imminent",
            tenantId, sacrificeYear,
            targetSacrificeNo: targetNo,
            deliveryFilter: toDeliveryFilter(s.recipient_scope),
            templateContent: imminentTpl.content,
            templateId: imminentTpl.id,
            tenantBranding,
            sacrificeId: targetAnimal.sacrifice_id,
            context: { triggered_sacrifice_no: sacrificeNo, avg_slaughter_minutes: avgSlaughterMinutes, slaughter_offset: offset },
          });
        }
      }
    }

    // SMS-2: slaughter_completed
    const completedTpl = templateMap.get("slaughter_completed");
    if (completedTpl) {
      const s = getEventSettings("slaughter_completed");
      await fireEvent({
        eventKey: "slaughter_completed",
        tenantId, sacrificeYear,
        targetSacrificeNo: sacrificeNo,
        deliveryFilter: toDeliveryFilter(s.recipient_scope),
        templateContent: completedTpl.content,
        templateId: completedTpl.id,
        tenantBranding,
        sacrificeId: currentSacrificeId,
        context: { triggered_sacrifice_no: sacrificeNo, avg_slaughter_minutes: avgSlaughterMinutes, slaughter_offset: 0 },
      });
    }
  }

  // ── Parçalama aşaması ───────────────────────────────────────────────────────
  if (stage === "butcher_stage") {
    // parcalama_tahmini_bekleme_suresi: delivery_time(N) − butcher_time(N−1) ortalaması
    const avgParcalamaBeklemeMinutes = await fetchAvgParcalamaTeslimatMinutes(
      tenantId,
      sacrificeYear,
      sacrificeNo
    );

    // SMS-3: butcher_started → Teslim Almaya Çağrı (hedef: işaretlenen no + offset)
    const butcherTpl = templateMap.get("butcher_started");
    if (butcherTpl) {
      const s = getEventSettings("butcher_started");
      const tenantPickupOffset = Number(settings?.sms_delivery_pickup_offset ?? 2) || 2;
      const offset = s.target_offset ?? tenantPickupOffset;
      const targetNo = sacrificeNo + offset;

      let shouldSend = true;

      {
        const { data: targetAnimalCheck } = await supabaseAdmin
          .from("sacrifice_animals").select("sacrifice_id")
          .eq("tenant_id", tenantId).eq("sacrifice_no", targetNo).eq("sacrifice_year", sacrificeYear)
          .single();
        if (!targetAnimalCheck) shouldSend = false;
      }

      if (shouldSend) {
        const alreadyDelivered = await isSacrificeStageAlreadyDone(
          tenantId,
          sacrificeYear,
          targetNo,
          "delivery_time"
        );
        if (alreadyDelivered) shouldSend = false;
      }

      if (shouldSend) {
        const { data: targetAnimal } = await supabaseAdmin
          .from("sacrifice_animals").select("sacrifice_id")
          .eq("tenant_id", tenantId).eq("sacrifice_no", targetNo).eq("sacrifice_year", sacrificeYear)
          .single();
        if (targetAnimal) {
          await fireEvent({
            eventKey: "butcher_started",
            tenantId, sacrificeYear,
            targetSacrificeNo: targetNo,
            deliveryFilter: toDeliveryFilter(s.recipient_scope),
            templateContent: butcherTpl.content,
            templateId: butcherTpl.id,
            tenantBranding,
            sacrificeId: targetAnimal.sacrifice_id,
            context: {
              parcalanan_sacrifice_no: sacrificeNo,
              avg_parcalama_bekleme_minutes: avgParcalamaBeklemeMinutes,
              delivery_offset: offset,
            },
          });
        }
      }
    }
  }

  // ── Teslimat aşaması ────────────────────────────────────────────────────────
  if (stage === "delivery_stage") {
    const avgSeconds = await fetchAvgDuration(tenantId, sacrificeYear, "delivery_stage");
    const avgDeliveryMinutes = avgSeconds > 0 ? avgSeconds / 60 : 0;

    // SMS-4a: delivery_completed — kesimhane ve dış teslimat için ayrı metinler
    const deliveryCompletedTpl = templateMap.get("delivery_completed");
    if (deliveryCompletedTpl) {
      const deliveryCtx = {
        teslim_edilen_sacrifice_no: sacrificeNo,
        avg_delivery_minutes: avgDeliveryMinutes,
        delivery_offset: 0,
      };
      await fireEvent({
        eventKey: "delivery_completed",
        tenantId,
        sacrificeYear,
        targetSacrificeNo: sacrificeNo,
        deliveryFilter: "kesimhane_only",
        templateContent: deliveryCompletedTpl.content,
        templateId: deliveryCompletedTpl.id,
        tenantBranding,
        sacrificeId: currentSacrificeId,
        context: deliveryCtx,
      });
      const externalContent = deliveryCompletedTpl.content_external?.trim();
      if (externalContent) {
        await fireEvent({
          eventKey: "delivery_completed",
          tenantId,
          sacrificeYear,
          targetSacrificeNo: sacrificeNo,
          deliveryFilter: "external_only",
          templateContent: externalContent,
          templateId: deliveryCompletedTpl.id,
          tenantBranding,
          sacrificeId: currentSacrificeId,
          context: deliveryCtx,
        });
      }
    }

  }
}
