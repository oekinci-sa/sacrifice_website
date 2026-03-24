import { authOptions } from "@/lib/auth";
import { normalizeEmail } from "@/lib/email-utils";
import {
  htmlToPlainTextForEmail,
  mailBodyEditorHtmlToEmailHtml,
} from "@/lib/mail-rich-text";
import {
  getResendForTenant,
  getResendFromForAdminEmail,
} from "@/lib/resend-client";
import {
  getTenantIdFromHeaders,
  primaryHostFromHeaders,
} from "@/lib/tenant";
import { resolveTenantIdFromHost } from "@/lib/tenant-resolver";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const LOG = "[api/admin/send-email]";

/** Vercel: `console.error` + JSON (Log seviyesi / filtrede daha görünür olur) */
function sendEmailLog(
  requestId: string,
  step: string,
  data: Record<string, unknown> = {}
): void {
  try {
    console.error(
      JSON.stringify({
        tag: LOG,
        step,
        requestId,
        ts: new Date().toISOString(),
        ...data,
      })
    );
  } catch {
    console.error(LOG, step, requestId, "(log serialize failed)");
  }
}

/** İstekteki header'lar (middleware `x-tenant-id` dahil) — `next/headers` ile fark riskini azaltır */
function tenantResolutionSnapshot(h: Headers): Record<string, unknown> {
  const xTenant = h.get("x-tenant-id");
  const forwardedRaw = h.get("x-forwarded-host");
  const hostHdr = h.get("host");
  const primaryHost = primaryHostFromHeaders(h);
  const fromHostOnly = resolveTenantIdFromHost(primaryHost);
  return {
    hasXTenantId: Boolean(xTenant?.length),
    xTenantIdPrefix: xTenant ? `${xTenant.slice(0, 8)}…` : null,
    hostHeader: hostHdr,
    xForwardedHost: forwardedRaw,
    primaryHostUsedForResolver: primaryHost,
    tenantIdFromHostResolver: fromHostOnly,
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY?.trim()),
    nodeEnv: process.env.NODE_ENV,
  };
}

const ADMIN_ROLES = new Set(["admin", "editor", "super_admin"]);

const MAX_RECIPIENTS = 80;

const senderKindSchema = z.enum(["bilgi", "iletisim"]);

const bodySchema = z.object({
  subject: z.string().min(1, "Konu gerekli").max(300),
  /** WYSIWYG editör HTML çıktısı (sunucuda sanitize). */
  body: z.string().min(1, "Mesaj gerekli").max(120_000),
  recipients: z
    .array(z.string().email())
    .min(1, "En az bir alıcı seçin")
    .max(MAX_RECIPIENTS),
  sacrificeYear: z.number().int().min(2000).max(2100),
  /** Gönderen posta kutusu (bilgi@ veya iletisim@). */
  senderKind: senderKindSchema.default("iletisim"),
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const ridHeaders = { "X-Request-Id": requestId };

  const json = (body: Record<string, unknown>, status: number) =>
    NextResponse.json(body, { status, headers: ridHeaders });

  sendEmailLog(requestId, "request_in");

  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session?.user || !role || !ADMIN_ROLES.has(role)) {
      sendEmailLog(requestId, "auth_denied", {
        hasSession: !!session?.user,
        role: role ?? null,
      });
      return json({ error: "Yetkisiz erişim" }, 401);
    }

    sendEmailLog(requestId, "auth_ok", {
      userId: session.user?.email
        ? `${String(session.user.email).slice(0, 3)}…@${String(session.user.email).split("@")[1] ?? ""}`
        : "unknown",
      role,
    });

    const jsonBody = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(jsonBody);
    if (!parsed.success) {
      const zerr = parsed.error.flatten();
      sendEmailLog(requestId, "body_validation_failed", {
        formErrors: zerr.formErrors,
        fieldErrors: Object.keys(zerr.fieldErrors ?? {}),
      });
      const first = parsed.error.flatten().formErrors[0] ?? parsed.error.message;
      return json({ error: first }, 400);
    }

    const { subject, body, recipients, senderKind, sacrificeYear } = parsed.data;

    sendEmailLog(requestId, "body_ok", {
      recipientCount: recipients.length,
      sacrificeYear,
      senderKind,
      subjectLen: subject.length,
      bodyLen: body.length,
    });

    let textPlain: string;
    let html: string;
    try {
      textPlain = htmlToPlainTextForEmail(body);
      if (!textPlain.trim()) {
        return json({ error: "Mesaj boş olamaz" }, 400);
      }
      html = mailBodyEditorHtmlToEmailHtml(body);
    } catch (e) {
      sendEmailLog(requestId, "html_processing_error", {
        errorMessage: e instanceof Error ? e.message : String(e),
        errorName: e instanceof Error ? e.name : typeof e,
      });
      console.error("[send-email] mesaj html işleme", e);
      return json(
        {
          error:
            "Mesaj içeriği işlenemedi. Biçimlendirmeyi sadeleştirip tekrar deneyin.",
        },
        400
      );
    }

    const reqHeaders = request.headers;

    sendEmailLog(requestId, "pre_tenant", tenantResolutionSnapshot(reqHeaders));

    const tenantId = getTenantIdFromHeaders(reqHeaders);

    const from = getResendFromForAdminEmail(tenantId, senderKind);

    sendEmailLog(requestId, "tenant_resolved", {
      tenantId,
      senderKind,
      fromHeader: from.length > 220 ? `${from.slice(0, 220)}…` : from,
    });

    const uniqueRecipients = Array.from(
      new Set(recipients.map((e) => normalizeEmail(e)))
    );
    if (uniqueRecipients.length === 0) {
      sendEmailLog(requestId, "empty_recipients_after_normalize");
      return json({ error: "Geçerli alıcı yok" }, 400);
    }

    const resend = getResendForTenant(tenantId);
    if (!resend) {
      sendEmailLog(requestId, "resend_client_null", { tenantId });
      return json(
        {
          error:
            "E-posta yapılandırması eksik. Ortamda RESEND_API_KEY tanımlayın.",
        },
        503
      );
    }

    sendEmailLog(requestId, "resend_send_start", {
      recipientCount: uniqueRecipients.length,
      subjectLen: subject.length,
    });

    let sent = 0;
    const errors: string[] = [];

    for (const to of uniqueRecipients) {
      const { data, error } = await resend.emails.send({
        from,
        to,
        subject,
        html,
        text: textPlain,
      });
      if (error) {
        sendEmailLog(requestId, "resend_per_recipient_error", {
          toDomain: to.split("@")[1] ?? "?",
          resendError:
            typeof error === "object" && error !== null
              ? JSON.stringify(error)
              : String(error),
        });
        console.error(LOG, "resend.emails.send error", requestId, to, error);
        errors.push(to);
      } else {
        sendEmailLog(requestId, "resend_per_recipient_ok", {
          toDomain: to.split("@")[1] ?? "?",
          messageId: data?.id ?? null,
        });
        sent += 1;
      }
    }

    if (sent === 0) {
      sendEmailLog(requestId, "all_recipients_failed", {
        failedCount: errors.length,
      });
      return json(
        {
          error: "Hiçbir e-posta gönderilemedi. Resend ayarlarını kontrol edin.",
        },
        502
      );
    }

    sendEmailLog(requestId, "success", { sent, failed: errors.length });

    return json({
      ok: true,
      sent,
      failed: errors.length,
      failedRecipients: errors.length ? errors : undefined,
    }, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : undefined;
    sendEmailLog(requestId, "unhandled_exception", {
      message: msg,
      name: e instanceof Error ? e.name : typeof e,
      stack: stack?.slice(0, 2000),
    });
    console.error(LOG, "unhandled", requestId, msg, stack ?? e);
    return json(
      {
        error: "Beklenmeyen hata",
        requestId,
        ...(process.env.NODE_ENV === "development" ? { detail: msg } : {}),
      },
      500
    );
  }
}
