import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getTenantIdOptional } from "@/lib/tenant";
import {
  DEFAULT_AGREEMENT_TERMS,
  DEFAULT_BRANDING,
  type AgreementTerm,
  type TenantBranding,
} from "@/lib/tenant-branding-defaults";

export type { AgreementTerm, TenantBranding };
export { DEFAULT_AGREEMENT_TERMS, DEFAULT_BRANDING };

/**
 * Server-side: Tenant branding bilgilerini tenant_settings'tan alır.
 * Tenant yoksa varsayılan (ankara-kurban) döner.
 */
export async function getTenantBranding(): Promise<TenantBranding> {
  const tenantId = getTenantIdOptional();
  if (!tenantId) return DEFAULT_BRANDING;

  const { data } = await supabaseAdmin
    .from("tenant_settings")
    .select("logo_slug, iban, website_url, contact_phone, contact_email, contact_address, deposit_amount, deposit_deadline_days, full_payment_deadline_month, full_payment_deadline_day, agreement_terms")
    .eq("tenant_id", tenantId)
    .single();

  if (!data) return DEFAULT_BRANDING;

  const rawTerms = data.agreement_terms;
  const agreement_terms = Array.isArray(rawTerms) && rawTerms.length > 0
    ? (rawTerms as AgreementTerm[]).filter((t): t is AgreementTerm => t && typeof t.title === "string" && typeof t.description === "string")
    : DEFAULT_AGREEMENT_TERMS;

  return {
    logo_slug: data.logo_slug ?? DEFAULT_BRANDING.logo_slug,
    iban: data.iban ?? DEFAULT_BRANDING.iban,
    website_url: data.website_url ?? DEFAULT_BRANDING.website_url,
    contact_phone: data.contact_phone ?? DEFAULT_BRANDING.contact_phone,
    contact_email: data.contact_email ?? DEFAULT_BRANDING.contact_email,
    contact_address: data.contact_address ?? DEFAULT_BRANDING.contact_address,
    deposit_amount: Number(data.deposit_amount ?? DEFAULT_BRANDING.deposit_amount),
    deposit_deadline_days: Number(data.deposit_deadline_days ?? DEFAULT_BRANDING.deposit_deadline_days),
    full_payment_deadline_month: Number(data.full_payment_deadline_month ?? DEFAULT_BRANDING.full_payment_deadline_month),
    full_payment_deadline_day: Number(data.full_payment_deadline_day ?? DEFAULT_BRANDING.full_payment_deadline_day),
    agreement_terms,
  };
}
