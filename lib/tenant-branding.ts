import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getTenantIdOptional } from "@/lib/tenant";

export interface TenantBranding {
  tenant_id?: string | null;
  logo_slug: string;
  iban: string;
  website_url: string;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
}

const DEFAULT_BRANDING: TenantBranding = {
  logo_slug: "ankara-kurban",
  iban: "Kapora için IBAN bilgisi daha sonra sizlerle paylaşılacaktır.",
  website_url: "ankarakurban.com.tr",
  contact_phone: "0312 312 44 64 / 0552 652 90 00",
  contact_email: "iletisim@ankarakurban.com.tr",
  contact_address: "Hacı Bayram, Ulus, Adliye Sk. No:1 Altındağ/Ankara (09.00 - 18.00)",
};

/**
 * Server-side: Tenant branding bilgilerini tenant_settings'tan alır.
 * Tenant yoksa varsayılan (ankara-kurban) döner.
 */
export async function getTenantBranding(): Promise<TenantBranding> {
  const tenantId = getTenantIdOptional();
  if (!tenantId) return DEFAULT_BRANDING;

  const { data } = await supabaseAdmin
    .from("tenant_settings")
    .select("logo_slug, iban, website_url, contact_phone, contact_email, contact_address")
    .eq("tenant_id", tenantId)
    .single();

  if (!data) return DEFAULT_BRANDING;

  return {
    logo_slug: data.logo_slug ?? DEFAULT_BRANDING.logo_slug,
    iban: data.iban ?? DEFAULT_BRANDING.iban,
    website_url: data.website_url ?? DEFAULT_BRANDING.website_url,
    contact_phone: data.contact_phone ?? DEFAULT_BRANDING.contact_phone,
    contact_email: data.contact_email ?? DEFAULT_BRANDING.contact_email,
    contact_address: data.contact_address ?? DEFAULT_BRANDING.contact_address,
  };
}
