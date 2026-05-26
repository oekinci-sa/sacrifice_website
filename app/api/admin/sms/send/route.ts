/**
 * POST /api/admin/sms/send
 *
 * SMS gönderim akışı:
 * 1. Auth + rol kontrolü (toplu: admin/super_admin; tekil: tüm admin rolleri)
 * 2. Zod validasyon
 * 3. idempotency_key kontrolü (zorunlu — çift gönderim engeli)
 * 4. Hissedarlar için şablon değişkenleri sunucuda doldurulur
 * 5. Telefon normalize → geçersizler skipped
 * 6. Dedup (her zaman): aynı kurbanlıkta aynı numara → tek SMS; farklı kurbanlıkta aynı numara → ayrı SMS
 * 7. Değişken çözümleme → hâlâ boş kalanlar için uyarı (gönderimi bloklamaz)
 * 8. Kredi kontrolü (tahmini SMS boyu ile)
 * 9. DB'ye sms_sends + sms_send_recipients yaz
 * 10. Bizim SMS API çağrısı
 * 11. Sonuçları güncelle
 */
import { authOptions } from "@/lib/auth";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSmsCredentials } from "@/lib/sms-config";
import { sendSms, queryCredit } from "@/lib/sms-client";
import { normalizePhone } from "@/lib/sms-phone-normalizer";
import { calculateSmsInfo } from "@/lib/sms-character-counter";
import { smsRecipientDedupKey } from "@/lib/sms-dedup";
import {
  buildSmsVariablesFromShareholderRow,
  type TenantSmsBranding,
} from "@/lib/sms-template-variables";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = new Set(["admin", "editor", "super_admin"]);
const BULK_ROLES = new Set(["admin", "super_admin"]);

/** Değişken kalıpları: {{variable_name}} */
const VARIABLE_REGEX = /\{\{([a-z_]+)\}\}/g;

const recipientSchema = z.object({
  shareholder_id: z.string().uuid().optional().nullable(),
  sacrifice_id: z.string().uuid().optional().nullable(),
  recipient_name: z.string().optional().nullable(),
  phone_number: z.string(),
  message: z.string().optional().nullable(),
  variables: z.record(z.string(), z.string().optional().nullable()).optional().nullable(),
});

const sendSchema = z.object({
  title: z.string().min(1, "Başlık zorunlu").max(200),
  message_content: z.string().min(1, "Mesaj içeriği zorunlu").max(882),
  recipients: z
    .array(recipientSchema)
    .min(1, "En az 1 alıcı gerekli"),
  sacrifice_year: z.number().int().min(2000).max(2100).optional().nullable(),
  template_id: z.string().uuid().optional().nullable(),
  target_type: z
    .enum([
      "single",
      "single_phone",
      "shareholder_pick",
      "sacrifice_all",
      "after_sacrifice_no",
      "sacrifice_range",
      "filtered",
      "custom",
    ])
    .default("custom"),
  target_params: z.record(z.string(), z.unknown()).optional().nullable(),
  /** Geriye dönük uyumluluk; sunucu her zaman kurban bazlı dedup uygular. */
  deduplicate_phone_numbers: z.boolean().default(true),
  idempotency_key: z.string().uuid("idempotency_key geçerli bir UUID olmalı"),
  allowCreditCheckFailure: z.boolean().default(false),
});

/** Değişkenleri çözer; yalnızca null/undefined eksik sayılır (boş string geçerlidir). */
function resolveVariables(
  template: string,
  vars: Record<string, string | null | undefined> | null | undefined
): { resolved: string; emptyVars: string[] } {
  const emptyVars: string[] = [];
  const resolved = template.replace(VARIABLE_REGEX, (match, name: string) => {
    const value = vars?.[name];
    if (value === undefined || value === null) {
      emptyVars.push(name);
      return match;
    }
    return value;
  });
  return { resolved, emptyVars };
}

/** Dedup anahtarı — bkz. lib/sms-dedup.ts */

type ProcessedRecipient = z.infer<typeof recipientSchema> & {
  normalized: string | null;
  skipReason: "invalid_phone" | "duplicate" | null;
  finalMessage: string;
  sms_parts: number;
  sacrifice_id_db: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session?.user || !role || !ADMIN_ROLES.has(role)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      title,
      message_content,
      recipients,
      sacrifice_year,
      template_id,
      target_type,
      target_params,
      idempotency_key,
      allowCreditCheckFailure,
    } = parsed.data;

    const deduplicate_phone_numbers = true;

    if (recipients.length > 1 && !BULK_ROLES.has(role)) {
      return NextResponse.json(
        { error: "Toplu SMS gönderme yetkiniz yok" },
        { status: 403 }
      );
    }

    const tenantId = getTenantId();

    const { data: existing } = await supabaseAdmin
      .from("sms_sends")
      .select("id, status")
      .eq("idempotency_key", idempotency_key)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Bu gönderim zaten işlendi", sendId: existing.id, status: existing.status },
        { status: 409 }
      );
    }

    const credentials = getSmsCredentials(tenantId);
    if (!credentials) {
      return NextResponse.json(
        { error: "SMS API yapılandırması eksik. Lütfen sistem yöneticisiyle iletişime geçin." },
        { status: 503 }
      );
    }

    const shareholderIds = Array.from(
      new Set(recipients.map((r) => r.shareholder_id).filter((id): id is string => Boolean(id)))
    );

    const varMap = new Map<string, Record<string, string>>();
    let lookupBase =
      process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
      "http://localhost:3000";

    let tenantBranding: TenantSmsBranding = {
      iban: "",
      deposit_amount: 0,
      website_url: null,
    };

    if (shareholderIds.length > 0) {
      const [{ data: ts }, { data: shRows }] = await Promise.all([
        supabaseAdmin
          .from("tenant_settings")
          .select("iban, deposit_amount, website_url")
          .eq("tenant_id", tenantId)
          .maybeSingle(),
        supabaseAdmin
          .from("shareholders")
          .select(
            `shareholder_id, shareholder_name, phone_number, paid_amount, total_amount, remaining_payment,
             delivery_type, delivery_location, security_code,
             sacrifice:sacrifice_animals(sacrifice_no, sacrifice_time, planned_delivery_time, ear_tag)`
          )
          .eq("tenant_id", tenantId)
          .in("shareholder_id", shareholderIds),
      ]);

      if (ts) {
        tenantBranding = {
          iban: (ts.iban as string) ?? "",
          deposit_amount: Number(ts.deposit_amount ?? 0),
          website_url: (ts.website_url as string) ?? null,
        };
        const w = ts.website_url as string | null;
        if (w && String(w).trim()) {
          lookupBase = String(w).trim().replace(/\/$/, "");
        }
      }

      for (const row of shRows ?? []) {
        const sacRel = row.sacrifice as
          | {
              sacrifice_no: number;
              sacrifice_time: string | null;
              planned_delivery_time: string | null;
              ear_tag: string | null;
            }
          | {
              sacrifice_no: number;
              sacrifice_time: string | null;
              planned_delivery_time: string | null;
              ear_tag: string | null;
            }[]
          | null;
        const sac = Array.isArray(sacRel) ? sacRel[0] ?? null : sacRel;
        const vars = buildSmsVariablesFromShareholderRow(
          {
            shareholder_name: row.shareholder_name as string | null,
            phone_number: row.phone_number as string | null,
            paid_amount: row.paid_amount as number | null,
            total_amount: row.total_amount as number | null,
            remaining_payment: row.remaining_payment as number | null,
            delivery_type: row.delivery_type as string | null,
            delivery_location: row.delivery_location as string | null,
            security_code: row.security_code as string | null,
            sacrifice: sac
              ? {
                  sacrifice_no: sac.sacrifice_no,
                  sacrifice_time: sac.sacrifice_time,
                  planned_delivery_time: sac.planned_delivery_time,
                  ear_tag: sac.ear_tag,
                }
              : null,
          },
          tenantBranding,
          lookupBase
        );
        varMap.set(row.shareholder_id as string, vars);
      }
    }

    const seenDedup = new Set<string>();
    const totalRecipients = recipients.length;
    let excludedCount = 0;
    const allEmptyVarsByName = new Map<string, number>();

    const processedRecipients: ProcessedRecipient[] = recipients.map((r) => {
      const normalized = normalizePhone(r.phone_number);

      if (!normalized) {
        excludedCount++;
        return {
          ...r,
          normalized: null,
          skipReason: "invalid_phone" as const,
          finalMessage: r.message ?? message_content,
          sms_parts: 0,
          sacrifice_id_db: r.sacrifice_id ?? null,
        };
      }

      const sacrificeIdForDedup = r.sacrifice_id ?? null;

      if (deduplicate_phone_numbers) {
        const dk = smsRecipientDedupKey(
          normalized,
          sacrificeIdForDedup,
          r.shareholder_id ?? null
        );
        if (seenDedup.has(dk)) {
          excludedCount++;
          return {
            ...r,
            normalized,
            skipReason: "duplicate" as const,
            finalMessage: r.message ?? message_content,
            sms_parts: 0,
            sacrifice_id_db: r.sacrifice_id ?? null,
          };
        }
        seenDedup.add(dk);
      }

      const auto =
        r.shareholder_id && varMap.has(r.shareholder_id)
          ? varMap.get(r.shareholder_id)!
          : ({} as Record<string, string>);
      const mergedVars: Record<string, string | null | undefined> = {
        ...auto,
        ...(r.variables ?? {}),
      };

      const template = r.message ?? message_content;
      const { resolved, emptyVars } = resolveVariables(template, mergedVars);
      for (const v of emptyVars) {
        allEmptyVarsByName.set(v, (allEmptyVarsByName.get(v) ?? 0) + 1);
      }

      const { parts } = calculateSmsInfo(resolved);

      return {
        ...r,
        normalized,
        skipReason: null as null,
        finalMessage: resolved,
        sms_parts: parts,
        sacrifice_id_db: r.sacrifice_id ?? null,
      };
    });

    const excludedInvalidPhone = processedRecipients.filter(
      (r) => r.skipReason === "invalid_phone"
    ).length;
    const excludedDuplicatePhone = processedRecipients.filter((r) => r.skipReason === "duplicate").length;

    const toSend = processedRecipients.filter((r) => !r.skipReason && r.normalized);

    const estimatedTotalParts = toSend.reduce(
      (sum, r) => sum + (r.sms_parts ?? 0),
      0
    );

    const creditResult = await queryCredit(credentials);
    if (!creditResult.ok) {
      if (!allowCreditCheckFailure) {
        return NextResponse.json(
          {
            error:
              "SMS kredisi sorgulanamadı. Gönderimi zorla devam ettirmek için allowCreditCheckFailure: true gönderin.",
            creditError: creditResult.message,
            requiresConfirmation: true,
          },
          { status: 402 }
        );
      }
    } else {
      if (creditResult.credits < estimatedTotalParts) {
        return NextResponse.json(
          {
            error: `Yetersiz SMS kredisi. Mevcut: ${creditResult.credits}, tahmini gerekli: ${estimatedTotalParts}`,
          },
          { status: 402 }
        );
      }
    }

    const warnings: string[] = [];
    for (const [varName, count] of Array.from(allEmptyVarsByName.entries())) {
      warnings.push(`{{${varName}}} değişkeni ${count} alıcıda boş`);
    }

    const { data: sendRecord, error: sendInsertError } = await supabaseAdmin
      .from("sms_sends")
      .insert({
        tenant_id: tenantId,
        template_id: template_id ?? null,
        title,
        message_content,
        target_type,
        target_params: target_params ?? null,
        status: "sending",
        total_recipients: totalRecipients,
        excluded_count: excludedCount,
        estimated_total_sms_parts: estimatedTotalParts,
        deduplicate_phone_numbers,
        sacrifice_year: sacrifice_year ?? null,
        idempotency_key,
        created_by: session.user.email ?? session.user.name ?? "Bilinmeyen",
      })
      .select("id")
      .single();

    if (sendInsertError || !sendRecord) {
      console.error("[sms/send] sms_sends insert error:", sendInsertError);
      return NextResponse.json({ error: "Gönderim kaydı oluşturulamadı" }, { status: 500 });
    }

    const sendId = sendRecord.id as string;

    const recipientRows = processedRecipients.map((r) => ({
      send_id: sendId,
      tenant_id: tenantId,
      shareholder_id: r.shareholder_id ?? null,
      sacrifice_id: r.sacrifice_id_db ?? null,
      recipient_name: r.recipient_name ?? null,
      phone_number: r.normalized ?? r.phone_number,
      raw_phone_number: r.phone_number,
      personalized_message: r.finalMessage,
      sms_parts: r.sms_parts,
      status: r.skipReason ? "skipped" : "queued",
      skip_reason: r.skipReason ?? null,
    }));

    const { error: recipientsInsertError } = await supabaseAdmin
      .from("sms_send_recipients")
      .insert(recipientRows);

    if (recipientsInsertError) {
      await supabaseAdmin.from("sms_sends").update({ status: "failed" }).eq("id", sendId);
      console.error("[sms/send] recipients insert error:", recipientsInsertError);
      return NextResponse.json({ error: "Alıcı kayıtları oluşturulamadı" }, { status: 500 });
    }

    if (toSend.length === 0) {
      await supabaseAdmin
        .from("sms_sends")
        .update({
          status: "failed",
          sent_count: 0,
          failed_count: 0,
          completed_at: new Date().toISOString(),
        })
        .eq("id", sendId);

      return NextResponse.json(
        {
          ok: false,
          error: "Gönderilecek geçerli alıcı bulunamadı",
          sendId,
          sent: 0,
          failed: 0,
          excluded: excludedCount,
          excluded_invalid_phone: excludedInvalidPhone,
          excluded_duplicate_phone: excludedDuplicatePhone,
          warnings,
        },
        { status: 400 }
      );
    }

    const smsMessages = toSend.map((r) => ({
      phone: r.normalized!,
      message: r.finalMessage,
    }));

    const smsResult = await sendSms({ credentials, messages: smsMessages });

    let sentCount = 0;
    let failedCount = 0;
    let finalStatus: string;

    if (smsResult.ok) {
      sentCount = toSend.length;
      failedCount = 0;
      finalStatus = "completed";

      await supabaseAdmin
        .from("sms_send_recipients")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("send_id", sendId)
        .eq("status", "queued");
    } else {
      sentCount = 0;
      failedCount = toSend.length;
      finalStatus = "failed";

      await supabaseAdmin
        .from("sms_send_recipients")
        .update({
          status: "failed",
          error_code: smsResult.code,
          provider_response: { code: smsResult.code, message: smsResult.message },
        })
        .eq("send_id", sendId)
        .eq("status", "queued");
    }

    await supabaseAdmin
      .from("sms_sends")
      .update({
        status: finalStatus,
        sent_count: sentCount,
        failed_count: failedCount,
        actual_total_sms_parts: sentCount > 0 ? estimatedTotalParts : 0,
        completed_at: new Date().toISOString(),
      })
      .eq("id", sendId);

    if (!smsResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: smsResult.message,
          sendId,
          sent: 0,
          failed: failedCount,
          excluded: excludedCount,
          excluded_invalid_phone: excludedInvalidPhone,
          excluded_duplicate_phone: excludedDuplicatePhone,
          warnings,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      sendId,
      sent: sentCount,
      failed: failedCount,
      excluded: excludedCount,
      excluded_invalid_phone: excludedInvalidPhone,
      excluded_duplicate_phone: excludedDuplicatePhone,
      warnings,
    });
  } catch (e) {
    console.error("[sms/send]", e);
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}
