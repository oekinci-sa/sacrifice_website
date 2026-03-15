"use client";

import type { TenantBranding } from "@/lib/tenant-branding";
import { useEffect, useState } from "react";

const DEFAULT_BRANDING: TenantBranding = {
  logo_slug: "ankara-kurban",
  iban: "Kapora için IBAN bilgisi daha sonra sizlerle paylaşılacaktır.",
  website_url: "ankarakurban.com.tr",
  contact_phone: "0312 312 44 64 / 0552 652 90 00",
  contact_email: "iletisim@ankarakurban.com.tr",
  contact_address: "Hacı Bayram, Ulus, Adliye Sk. No:1 Altındağ/Ankara (09.00 - 18.00)",
};

export function useTenantBranding(): TenantBranding {
  const [branding, setBranding] = useState<TenantBranding>(DEFAULT_BRANDING);

  useEffect(() => {
    fetch("/api/tenant-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.branding) {
          setBranding({
            tenant_id: data.branding.tenant_id ?? null,
            logo_slug: data.branding.logo_slug ?? DEFAULT_BRANDING.logo_slug,
            iban: data.branding.iban ?? DEFAULT_BRANDING.iban,
            website_url: data.branding.website_url ?? DEFAULT_BRANDING.website_url,
            contact_phone: data.branding.contact_phone ?? DEFAULT_BRANDING.contact_phone,
            contact_email: data.branding.contact_email ?? DEFAULT_BRANDING.contact_email,
            contact_address: data.branding.contact_address ?? DEFAULT_BRANDING.contact_address,
          });
        }
      })
      .catch(() => {});
  }, []);

  return branding;
}
