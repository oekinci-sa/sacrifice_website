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
import { getTenantId } from "@/lib/tenant";
import { resolveTenantIdFromHost } from "@/lib/tenant-resolver";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const LOG = "[api/admin/send-email]";

/** Vercel / production debug: JSON satırı (grep: api/admin/send-email) */
function sendEmailLog(
  step: string,
  data: Record<string, unknown> = {}
): void {
  try {
    console.log(
      JSON.stringify({
        tag: LOG,
        step,
        ts: new Date().toISOString(),
        ...data,
      })
    );
  } catch {
    console.log(LOG, step, "(log serialize failed)");
  }
}

/** Tenant çözümlemesi: middleware header mı, host fallback mı — 500 ayıklamak için */
function tenantResolutionSnapshot(): Record<string, unknown> {
  const h = headers();
  const xTenant = h.get("x-tenant-id");
  const forwardedRaw = h.get("x-forwarded-host");
  const hostHdr = h.get("host");
  const primaryHost =
    forwardedRaw?.split(",")[0]?.trim() || hostHdr || "";
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
  sendEmailLog("request_in");
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session?.user || !role || !ADMIN_ROLES.has(role)) {
      sendEmailLog("auth_denied", {
        hasSession: !!session?.user,
        role: role ?? null,
      });
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    sendEmailLog("auth_ok", {
      userId: session.user?.email
        ? `${String(session.user.email).slice(0, 3)}…@${String(session.user.email).split("@")[1] ?? ""}`
        : "unknown",
      role,
    });

    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      const zerr = parsed.error.flatten();
      sendEmailLog("body_validation_failed", {
        formErrors: zerr.formErrors,
        fieldErrors: Object.keys(zerr.fieldErrors ?? {}),
      });
      const first = parsed.error.flatten().formErrors[0] ?? parsed.error.message;
      return NextResponse.json({ error: first }, { status: 400 });
    }

    const { subject, body, recipients, senderKind, sacrificeYear } = parsed.data;

    sendEmailLog("body_ok", {
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
        return NextResponse.json({ error: "Mesaj boş olamaz" }, { status: 400 });
      }
      html = mailBodyEditorHtmlToEmailHtml(body);
    } catch (e) {
      sendEmailLog("html_processing_error", {
        errorMessage: e instanceof Error ? e.message : String(e),
        errorName: e instanceof Error ? e.name : typeof e,
      });
      console.error("[send-email] mesaj html işleme", e);
      return NextResponse.json(
        {
          error:
            "Mesaj içeriği işlenemedi. Biçimlendirmeyi sadeleştirip tekrar deneyin.",
        },
        { status: 400 }
      );
    }

    sendEmailLog("pre_tenant", tenantResolutionSnapshot());

    const tenantId = getTenantId();

    const from = getResendFromForAdminEmail(tenantId, senderKind);

    sendEmailLog("tenant_resolved", {
      tenantId,
      senderKind,
      fromHeader: from.length > 220 ? `${from.slice(0, 220)}…` : from,
    });

    const uniqueRecipients = Array.from(
      new Set(recipients.map((e) => normalizeEmail(e)))
    );
    if (uniqueRecipients.length === 0) {
      sendEmailLog("empty_recipients_after_normalize");
      return NextResponse.json({ error: "Geçerli alıcı yok" }, { status: 400 });
    }

    const resend = getResendForTenant(tenantId);
    if (!resend) {
      sendEmailLog("resend_client_null", { tenantId });
      return NextResponse.json(
        {
          error:
            "E-posta yapılandırması eksik. Ortamda RESEND_API_KEY tanımlayın.",
        },
        { status: 503 }
      );
    }

    sendEmailLog("resend_send_start", {
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
        sendEmailLog("resend_per_recipient_error", {
          toDomain: to.split("@")[1] ?? "?",
          resendError:
            typeof error === "object" && error !== null
              ? JSON.stringify(error)
              : String(error),
        });
        console.error(LOG, "resend.emails.send error", to, error);
        errors.push(to);
      } else {
        sendEmailLog("resend_per_recipient_ok", {
          toDomain: to.split("@")[1] ?? "?",
          messageId: data?.id ?? null,
        });
        sent += 1;
      }
    }

    if (sent === 0) {
      sendEmailLog("all_recipients_failed", {
        failedCount: errors.length,
      });
      return NextResponse.json(
        { error: "Hiçbir e-posta gönderilemedi. Resend ayarlarını kontrol edin." },
        { status: 502 }
      );
    }

    sendEmailLog("success", { sent, failed: errors.length });

    return NextResponse.json({
      ok: true,
      sent,
      failed: errors.length,
      failedRecipients: errors.length ? errors : undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : undefined;
    sendEmailLog("unhandled_exception", {
      message: msg,
      name: e instanceof Error ? e.name : typeof e,
      stack: stack?.slice(0, 2000),
    });
    console.error(LOG, "unhandled", msg, stack ?? e);
    return NextResponse.json(
      {
        error: "Beklenmeyen hata",
        ...(process.env.NODE_ENV === "development" ? { detail: msg } : {}),
      },
      { status: 500 }
    );
  }
}
