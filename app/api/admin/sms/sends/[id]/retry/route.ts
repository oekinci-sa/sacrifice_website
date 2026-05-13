/**
 * POST /api/admin/sms/sends/[id]/retry
 *
 * Başarısız alıcıları yeni bir sms_sends kaydı açarak tekrar dener.
 * Eski gönderim kaydı değişmez; yeni kayıtta target_params.retry_of referansı tutulur.
 *
 * Akış:
 * 1. Orijinal gönderimdeki status='failed' alıcılar alınır
 * 2. Kredi kontrolü yapılır
 * 3. Telefon normalize + dedup (kurban bazlı)
 * 4. Yeni sms_sends + sms_send_recipients oluşturulur
 * 5. Bizim SMS API çağrısı yapılır
 * 6. Sonuçlar güncellenir
 */
import { authOptions } from "@/lib/auth";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSmsCredentials } from "@/lib/sms-config";
import { sendSms, queryCredit } from "@/lib/sms-client";
import { normalizePhone } from "@/lib/sms-phone-normalizer";
import { calculateSmsInfo } from "@/lib/sms-character-counter";
import { smsRecipientDedupKey } from "@/lib/sms-dedup";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["admin", "super_admin"]);

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session?.user || !role || !ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const tenantId = getTenantId();
    const originalSendId = params.id;

    // Orijinal gönderimi al
    const { data: originalSend, error: sendError } = await supabaseAdmin
      .from("sms_sends")
      .select(
        "id, title, message_content, template_id, sacrifice_year, deduplicate_phone_numbers, status"
      )
      .eq("id", originalSendId)
      .eq("tenant_id", tenantId)
      .single();

    if (sendError || !originalSend) {
      return NextResponse.json({ error: "Gönderim bulunamadı" }, { status: 404 });
    }

    if (!["completed", "partial_fail", "failed"].includes(originalSend.status)) {
      return NextResponse.json(
        { error: "Yalnızca tamamlanmış veya kısmen başarısız gönderimler yeniden denenebilir" },
        { status: 400 }
      );
    }

    // Başarısız alıcıları al
    const { data: failedRecipients, error: recError } = await supabaseAdmin
      .from("sms_send_recipients")
      .select(
        "id, recipient_name, phone_number, raw_phone_number, personalized_message, shareholder_id, sacrifice_id"
      )
      .eq("send_id", originalSendId)
      .eq("status", "failed");

    if (recError) {
      return NextResponse.json({ error: "Alıcılar alınamadı" }, { status: 500 });
    }

    if (!failedRecipients?.length) {
      return NextResponse.json(
        { error: "Tekrar denenecek başarısız alıcı bulunamadı" },
        { status: 400 }
      );
    }

    // SMS API kimlik bilgileri
    const credentials = getSmsCredentials(tenantId);
    if (!credentials) {
      return NextResponse.json(
        { error: "SMS API yapılandırması eksik" },
        { status: 503 }
      );
    }

    // Kredi kontrolü (retry için yeniden yapılır)
    const creditResult = await queryCredit(credentials);
    if (!creditResult.ok) {
      return NextResponse.json(
        {
          error: "SMS kredisi sorgulanamadı. İşleme devam etmek için lütfen tekrar deneyin.",
          creditError: creditResult.message,
          requiresConfirmation: true,
        },
        { status: 402 }
      );
    }

    const dedupeEnabled = originalSend.deduplicate_phone_numbers ?? true;

    const seenRetry = new Set<string>();
    let excludedCount = 0;
    const processedRecipients = failedRecipients.map((r) => {
      const normalized = normalizePhone(r.phone_number);

      if (!normalized) {
        excludedCount++;
        return { ...r, normalized: null, skipReason: "invalid_phone" as const };
      }

      if (dedupeEnabled) {
        const dk = smsRecipientDedupKey(
          normalized,
          r.sacrifice_id as string | null | undefined,
          r.shareholder_id as string | null | undefined
        );
        if (seenRetry.has(dk)) {
          excludedCount++;
          return { ...r, normalized, skipReason: "duplicate" as const };
        }
        seenRetry.add(dk);
      }

      return { ...r, normalized, skipReason: null as null };
    });

    const toSend = processedRecipients.filter((r) => !r.skipReason && r.normalized);

    if (toSend.length === 0) {
      return NextResponse.json(
        { error: "Tekrar gönderilecek geçerli alıcı bulunamadı (geçersiz veya yinelenen)" },
        { status: 400 }
      );
    }

    // Tahmini SMS parça sayısı ve kredi yeterliliği
    const estimatedParts = toSend.reduce((sum, r) => {
      const { parts } = calculateSmsInfo(r.personalized_message);
      return sum + parts;
    }, 0);

    if (creditResult.credits < estimatedParts) {
      return NextResponse.json(
        {
          error: `Yetersiz SMS kredisi. Mevcut: ${creditResult.credits}, tahmini gerekli: ${estimatedParts}`,
        },
        { status: 402 }
      );
    }

    // Yeni sms_sends kaydı oluştur
    const newIdempotencyKey = uuidv4();
    const { data: newSend, error: insertError } = await supabaseAdmin
      .from("sms_sends")
      .insert({
        tenant_id: tenantId,
        template_id: originalSend.template_id ?? null,
        title: `[Tekrar Deneme] ${originalSend.title}`,
        message_content: originalSend.message_content,
        target_type: "custom",
        target_params: {
          retry_of: originalSendId,
          retry_reason: "failed_recipients",
        },
        status: "sending",
        total_recipients: failedRecipients.length,
        excluded_count: excludedCount,
        estimated_total_sms_parts: estimatedParts,
        deduplicate_phone_numbers: originalSend.deduplicate_phone_numbers ?? true,
        sacrifice_year: originalSend.sacrifice_year ?? null,
        idempotency_key: newIdempotencyKey,
        provider: "bizimsms",
        created_by: session.user.email ?? session.user.name ?? "Bilinmeyen",
      })
      .select("id")
      .single();

    if (insertError || !newSend) {
      console.error("[sms/retry] sms_sends insert error:", insertError);
      return NextResponse.json({ error: "Gönderim kaydı oluşturulamadı" }, { status: 500 });
    }

    const newSendId = newSend.id as string;

    // Alıcı kayıtları
    const recipientRows = processedRecipients.map((r) => ({
      send_id: newSendId,
      tenant_id: tenantId,
      shareholder_id: r.shareholder_id ?? null,
      sacrifice_id: (r as { sacrifice_id?: string | null }).sacrifice_id ?? null,
      recipient_name: r.recipient_name ?? null,
      phone_number: r.normalized ?? r.phone_number,
      raw_phone_number: r.raw_phone_number ?? r.phone_number,
      personalized_message: r.personalized_message,
      sms_parts: r.skipReason ? 0 : calculateSmsInfo(r.personalized_message).parts,
      status: r.skipReason ? "skipped" : "queued",
      skip_reason: r.skipReason ?? null,
    }));

    const { error: recInsertError } = await supabaseAdmin
      .from("sms_send_recipients")
      .insert(recipientRows);

    if (recInsertError) {
      await supabaseAdmin.from("sms_sends").update({ status: "failed" }).eq("id", newSendId);
      return NextResponse.json({ error: "Alıcı kayıtları oluşturulamadı" }, { status: 500 });
    }

    // Bizim SMS API çağrısı
    const smsMessages = toSend.map((r) => ({
      phone: r.normalized!,
      message: r.personalized_message,
    }));

    const smsResult = await sendSms({ credentials, messages: smsMessages });

    let sentCount: number;
    let failedCount: number;
    let finalStatus: string;

    if (smsResult.ok) {
      sentCount = toSend.length;
      failedCount = 0;
      finalStatus = "completed";

      await supabaseAdmin
        .from("sms_send_recipients")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("send_id", newSendId)
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
        .eq("send_id", newSendId)
        .eq("status", "queued");
    }

    await supabaseAdmin
      .from("sms_sends")
      .update({
        status: finalStatus,
        sent_count: sentCount,
        failed_count: failedCount,
        actual_total_sms_parts: sentCount > 0 ? estimatedParts : 0,
        completed_at: new Date().toISOString(),
      })
      .eq("id", newSendId);

    if (!smsResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: smsResult.message,
          newSendId,
          originalSendId,
          sent: 0,
          failed: failedCount,
          excluded: excludedCount,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      newSendId,
      originalSendId,
      sent: sentCount,
      failed: failedCount,
      excluded: excludedCount,
    });
  } catch (e) {
    console.error("[sms/retry]", e);
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}
