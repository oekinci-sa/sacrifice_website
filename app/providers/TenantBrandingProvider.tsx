"use client";

import {
  DEFAULT_AGREEMENT_COPY,
  DEFAULT_BRANDING,
  type TenantBranding,
} from "@/lib/tenant-branding-defaults";
import { createContext, useContext, useEffect, useState } from "react";

interface TenantBrandingContextValue {
  branding: TenantBranding;
  setBranding: (b: TenantBranding) => void;
}

const TenantBrandingContext = createContext<TenantBrandingContextValue | null>(null);

export function TenantBrandingProvider({
  children,
  initialBranding,
}: {
  children: React.ReactNode;
  initialBranding: TenantBranding | null;
}) {
  const [branding, setBranding] = useState<TenantBranding>(
    initialBranding ?? DEFAULT_BRANDING
  );

  useEffect(() => {
    if (initialBranding) return; // Sunucudan geldiyse tekrar fetch etme
    fetch("/api/tenant-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.branding) {
          const rawTerms = data.branding.agreement_terms;
          const agreement_terms = Array.isArray(rawTerms) && rawTerms.length > 0
            ? rawTerms.filter((t: unknown) => t && typeof t === "object" && "title" in t && "description" in t) as { title: string; description: string }[]
            : DEFAULT_BRANDING.agreement_terms;
          setBranding({
            tenant_id: data.branding.tenant_id ?? null,
            logo_slug: data.branding.logo_slug ?? DEFAULT_BRANDING.logo_slug,
            iban: data.branding.iban ?? DEFAULT_BRANDING.iban,
            website_url: data.branding.website_url ?? DEFAULT_BRANDING.website_url,
            contact_phone: data.branding.contact_phone ?? DEFAULT_BRANDING.contact_phone,
            contact_email: data.branding.contact_email ?? DEFAULT_BRANDING.contact_email,
            contact_address: data.branding.contact_address ?? DEFAULT_BRANDING.contact_address,
            deposit_amount: Number(data.branding.deposit_amount ?? DEFAULT_BRANDING.deposit_amount),
            deposit_deadline_days: Number(data.branding.deposit_deadline_days ?? DEFAULT_BRANDING.deposit_deadline_days),
            full_payment_deadline_month: Number(data.branding.full_payment_deadline_month ?? DEFAULT_BRANDING.full_payment_deadline_month),
            full_payment_deadline_day: Number(data.branding.full_payment_deadline_day ?? DEFAULT_BRANDING.full_payment_deadline_day),
            agreement_terms,
            agreement_dialog_title:
              (typeof data.branding.agreement_dialog_title === "string" && data.branding.agreement_dialog_title.trim() !== "")
                ? data.branding.agreement_dialog_title.trim()
                : DEFAULT_AGREEMENT_COPY.agreement_dialog_title,
            agreement_main_heading:
              (typeof data.branding.agreement_main_heading === "string" && data.branding.agreement_main_heading.trim() !== "")
                ? data.branding.agreement_main_heading.trim()
                : DEFAULT_AGREEMENT_COPY.agreement_main_heading,
            agreement_intro_text:
              (typeof data.branding.agreement_intro_text === "string" && data.branding.agreement_intro_text.trim() !== "")
                ? data.branding.agreement_intro_text
                : DEFAULT_AGREEMENT_COPY.agreement_intro_text,
            agreement_footer_text:
              (typeof data.branding.agreement_footer_text === "string" && data.branding.agreement_footer_text.trim() !== "")
                ? data.branding.agreement_footer_text
                : DEFAULT_AGREEMENT_COPY.agreement_footer_text,
            agreement_notice_after_term_title:
              typeof data.branding.agreement_notice_after_term_title === "string" && data.branding.agreement_notice_after_term_title.trim() !== ""
                ? data.branding.agreement_notice_after_term_title.trim()
                : null,
            agreement_notice_after_term_body:
              typeof data.branding.agreement_notice_after_term_body === "string" && data.branding.agreement_notice_after_term_body.trim() !== ""
                ? data.branding.agreement_notice_after_term_body
                : null,
          });
        }
      })
      .catch(() => {});
  }, [initialBranding]);

  return (
    <TenantBrandingContext.Provider value={{ branding, setBranding }}>
      {children}
    </TenantBrandingContext.Provider>
  );
}

export function useTenantBrandingContext(): TenantBranding {
  const ctx = useContext(TenantBrandingContext);
  return ctx?.branding ?? DEFAULT_BRANDING;
}
