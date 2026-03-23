import {
  GOLBASI_TENANT_ID,
  KAHRAMANKAZAN_TENANT_ID,
  TEST_TENANT_ID,
} from "@/lib/tenant-resolver";
import { Resend } from "resend";

const DEFAULT_FROM_ANKARAKURBAN = "iletisim@ankarakurban.com.tr";
const DEFAULT_FROM_ELYAHAYVANCILIK = "iletisim@elyahayvancilik.com.tr";

function resolveResendApiKey(tenantId: string): string | undefined {
  if (tenantId === KAHRAMANKAZAN_TENANT_ID) {
    return (
      process.env.RESEND_API_KEY_ANKARAKURBAN?.trim() ||
      process.env.RESEND_API_KEY?.trim()
    );
  }
  if (tenantId === GOLBASI_TENANT_ID) {
    return (
      process.env.RESEND_API_KEY_ELYAHAYVANCILIK?.trim() ||
      process.env.RESEND_API_KEY?.trim()
    );
  }
  if (tenantId === TEST_TENANT_ID) {
    return process.env.RESEND_API_KEY?.trim();
  }
  return process.env.RESEND_API_KEY?.trim();
}

/** İstekteki tenant için Resend istemcisi; anahtar yoksa null. */
export function getResendForTenant(tenantId: string): Resend | null {
  const key = resolveResendApiKey(tenantId);
  if (!key) return null;
  return new Resend(key);
}

/**
 * Gönderen adresi (Resend’de doğrulanmış domain ile uyumlu olmalı).
 * Ortam: RESEND_FROM_ANKARAKURBAN, RESEND_FROM_ELYAHAYVANCILIK veya test için RESEND_FROM_EMAIL.
 */
export function getResendFromEmailForTenant(tenantId: string): string {
  if (tenantId === KAHRAMANKAZAN_TENANT_ID) {
    return (
      process.env.RESEND_FROM_ANKARAKURBAN?.trim() || DEFAULT_FROM_ANKARAKURBAN
    );
  }
  if (tenantId === GOLBASI_TENANT_ID) {
    return (
      process.env.RESEND_FROM_ELYAHAYVANCILIK?.trim() ||
      DEFAULT_FROM_ELYAHAYVANCILIK
    );
  }
  return process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";
}
