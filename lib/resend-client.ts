import {
  DEFAULT_BILGI_ANKARAKURBAN,
  DEFAULT_BILGI_ELYAHAYVANCILIK,
  DEFAULT_ILETISIM_ANKARAKURBAN,
  DEFAULT_ILETISIM_ELYAHAYVANCILIK,
  DISPLAY_ANKARA,
  DISPLAY_ANKARA_ILETISIM,
  DISPLAY_ELYA,
  DISPLAY_ELYA_ILETISIM,
  type AdminMailSenderKind,
} from "@/lib/resend-mail-config";
import { GOLBASI_TENANT_ID, KAHRAMANKAZAN_TENANT_ID } from "@/lib/tenant-resolver";
import { Resend } from "resend";

export type { AdminMailSenderKind } from "@/lib/resend-mail-config";

/** Tek Resend Pro anahtarı (tüm tenant’lar). */
function getResendApiKey(): string | undefined {
  return process.env.RESEND_API_KEY?.trim();
}

/** İstekteki tenant için Resend istemcisi; anahtar yoksa null. */
export function getResendForTenant(_tenantId: string): Resend | null {
  const key = getResendApiKey();
  if (!key) return null;
  return new Resend(key);
}

function formatFrom(displayName: string, email: string): string {
  const escaped = displayName.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}" <${email}>`;
}

function resolveAdminDisplayName(
  tenantId: string,
  kind: AdminMailSenderKind
): string {
  const iletisim = kind === "iletisim";
  if (tenantId === KAHRAMANKAZAN_TENANT_ID) {
    return iletisim ? DISPLAY_ANKARA_ILETISIM : DISPLAY_ANKARA;
  }
  if (tenantId === GOLBASI_TENANT_ID) {
    return iletisim ? DISPLAY_ELYA_ILETISIM : DISPLAY_ELYA;
  }
  return iletisim ? "İletişim" : "Bilgilendirme";
}

function resolveAdminMailboxEmail(
  tenantId: string,
  kind: AdminMailSenderKind
): string {
  if (tenantId === KAHRAMANKAZAN_TENANT_ID) {
    if (kind === "bilgi") {
      return (
        process.env.RESEND_BILGI_ANKARAKURBAN?.trim() || DEFAULT_BILGI_ANKARAKURBAN
      );
    }
    return (
      process.env.RESEND_FROM_ANKARAKURBAN?.trim() || DEFAULT_ILETISIM_ANKARAKURBAN
    );
  }
  if (tenantId === GOLBASI_TENANT_ID) {
    if (kind === "bilgi") {
      return (
        process.env.RESEND_BILGI_ELYAHAYVANCILIK?.trim() ||
        DEFAULT_BILGI_ELYAHAYVANCILIK
      );
    }
    return (
      process.env.RESEND_FROM_ELYAHAYVANCILIK?.trim() ||
      DEFAULT_ILETISIM_ELYAHAYVANCILIK
    );
  }
  return process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";
}

/**
 * Admin toplu e-posta: bilgi@ veya iletisim@ kutusu + tenant görünen adı (Resend From).
 */
export function getResendFromForAdminEmail(
  tenantId: string,
  kind: AdminMailSenderKind
): string {
  const email = resolveAdminMailboxEmail(tenantId, kind);
  const name = resolveAdminDisplayName(tenantId, kind);
  return formatFrom(name, email);
}

/**
 * Hisse alım onayı e-postası: bilgi@… adresi + bilgilendirme görünen adı.
 * İsteğe bağlı: RESEND_PURCHASE_FROM_ANKARAKURBAN / RESEND_PURCHASE_FROM_ELYAHAYVANCILIK (yalnızca e-posta adresi).
 */
export function getResendFromForPurchaseConfirmation(tenantId: string): string {
  if (tenantId === KAHRAMANKAZAN_TENANT_ID) {
    const email =
      process.env.RESEND_PURCHASE_FROM_ANKARAKURBAN?.trim() ||
      DEFAULT_BILGI_ANKARAKURBAN;
    return formatFrom(DISPLAY_ANKARA, email);
  }
  if (tenantId === GOLBASI_TENANT_ID) {
    const email =
      process.env.RESEND_PURCHASE_FROM_ELYAHAYVANCILIK?.trim() ||
      DEFAULT_BILGI_ELYAHAYVANCILIK;
    return formatFrom(DISPLAY_ELYA, email);
  }
  const email = process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";
  return formatFrom("Bilgilendirme", email);
}
