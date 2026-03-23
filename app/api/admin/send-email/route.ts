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
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

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
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session?.user || !role || !ADMIN_ROLES.has(role)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      const first = parsed.error.flatten().formErrors[0] ?? parsed.error.message;
      return NextResponse.json({ error: first }, { status: 400 });
    }

    const { subject, body, recipients, senderKind } = parsed.data;
    const textPlain = htmlToPlainTextForEmail(body);
    if (!textPlain.trim()) {
      return NextResponse.json({ error: "Mesaj boş olamaz" }, { status: 400 });
    }
    const html = mailBodyEditorHtmlToEmailHtml(body);
    const tenantId = getTenantId();

    const uniqueRecipients = Array.from(
      new Set(recipients.map((e) => normalizeEmail(e)))
    );
    if (uniqueRecipients.length === 0) {
      return NextResponse.json({ error: "Geçerli alıcı yok" }, { status: 400 });
    }

    const resend = getResendForTenant(tenantId);
    if (!resend) {
      return NextResponse.json(
        {
          error:
            "E-posta yapılandırması eksik. Ortamda RESEND_API_KEY tanımlayın.",
        },
        { status: 503 }
      );
    }

    const from = getResendFromForAdminEmail(tenantId, senderKind);

    let sent = 0;
    const errors: string[] = [];

    for (const to of uniqueRecipients) {
      const { error } = await resend.emails.send({
        from,
        to,
        subject,
        html,
        text: textPlain,
      });
      if (error) {
        console.error("[send-email]", to, error);
        errors.push(to);
      } else {
        sent += 1;
      }
    }

    if (sent === 0) {
      return NextResponse.json(
        { error: "Hiçbir e-posta gönderilemedi. Resend ayarlarını kontrol edin." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      sent,
      failed: errors.length,
      failedRecipients: errors.length ? errors : undefined,
    });
  } catch (e) {
    console.error("[send-email]", e);
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}
