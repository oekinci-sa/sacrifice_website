import { parseContactSocialLinks } from "@/lib/contact-social-links";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { DEFAULT_AGREEMENT_COPY, DEFAULT_BRANDING } from "@/lib/tenant-branding-defaults";
import { getTenantId } from "@/lib/tenant";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/tenant-settings - Tenant tema ayarlarını döner (theme_json)
 * CSS değişkenleri için kullanılır: --primary, --secondary, --primary-dark vb.
 */
export async function GET() {
  try {
    const tenantId = getTenantId();

    const { data, error } = await supabaseAdmin
      .from("tenant_settings")
      .select(
        "theme_json, homepage_mode, logo_slug, iban, iban_account_holder, website_url, contact_phone, contact_email, contact_address, contact_address_label, contact_email_label, contact_phone_label, contact_social_links, deposit_amount, deposit_deadline_days, full_payment_deadline_month, full_payment_deadline_day, active_sacrifice_year, agreement_terms, agreement_dialog_title, agreement_main_heading, agreement_intro_text, agreement_footer_text, agreement_notice_after_term_title, agreement_notice_after_term_body"
      )
      .eq("tenant_id", tenantId)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Tenant ayarları alınamadı" },
        { status: 500 }
      );
    }

    const theme = data?.theme_json ?? {};
    const homepageMode = data?.homepage_mode ?? "bana_haber_ver";
    const rawTerms = data?.agreement_terms;
    const agreement_terms = Array.isArray(rawTerms) && rawTerms.length > 0
      ? (rawTerms as { title: string; description: string }[]).filter((t) => t && typeof t.title === "string" && typeof t.description === "string")
      : [];
    const labelOr = (v: unknown, fallback: string) =>
      typeof v === "string" && v.trim() !== "" ? v.trim() : fallback;

    const branding = {
      tenant_id: tenantId,
      logo_slug: data?.logo_slug ?? "ankara-kurban",
      iban: data?.iban ?? "Kapora için IBAN bilgisi daha sonra sizlerle paylaşılacaktır.",
      iban_account_holder:
        typeof data?.iban_account_holder === "string" && data.iban_account_holder.trim() !== ""
          ? data.iban_account_holder.trim()
          : null,
      website_url: data?.website_url ?? "",
      contact_phone: data?.contact_phone ?? "",
      contact_email: data?.contact_email ?? "",
      contact_address: data?.contact_address ?? "",
      contact_address_label: labelOr(data?.contact_address_label, DEFAULT_BRANDING.contact_address_label),
      contact_email_label: labelOr(data?.contact_email_label, DEFAULT_BRANDING.contact_email_label),
      contact_phone_label: labelOr(data?.contact_phone_label, DEFAULT_BRANDING.contact_phone_label),
      contact_social_links: parseContactSocialLinks(data?.contact_social_links),
      deposit_amount: Number(data?.deposit_amount ?? DEFAULT_BRANDING.deposit_amount),
      deposit_deadline_days: Number(data?.deposit_deadline_days ?? 3),
      full_payment_deadline_month: Number(data?.full_payment_deadline_month ?? 5),
      full_payment_deadline_day: Number(data?.full_payment_deadline_day ?? 20),
      active_sacrifice_year:
        data?.active_sacrifice_year != null && !Number.isNaN(Number(data.active_sacrifice_year))
          ? Number(data.active_sacrifice_year)
          : null,
      agreement_terms,
      agreement_dialog_title:
        (typeof data?.agreement_dialog_title === "string" && data.agreement_dialog_title.trim() !== "")
          ? data.agreement_dialog_title.trim()
          : DEFAULT_AGREEMENT_COPY.agreement_dialog_title,
      agreement_main_heading:
        (typeof data?.agreement_main_heading === "string" && data.agreement_main_heading.trim() !== "")
          ? data.agreement_main_heading.trim()
          : DEFAULT_AGREEMENT_COPY.agreement_main_heading,
      agreement_intro_text:
        (typeof data?.agreement_intro_text === "string" && data.agreement_intro_text.trim() !== "")
          ? data.agreement_intro_text
          : DEFAULT_AGREEMENT_COPY.agreement_intro_text,
      agreement_footer_text:
        (typeof data?.agreement_footer_text === "string" && data.agreement_footer_text.trim() !== "")
          ? data.agreement_footer_text
          : DEFAULT_AGREEMENT_COPY.agreement_footer_text,
      agreement_notice_after_term_title:
        typeof data?.agreement_notice_after_term_title === "string" && data.agreement_notice_after_term_title.trim() !== ""
          ? data.agreement_notice_after_term_title.trim()
          : null,
      agreement_notice_after_term_body:
        typeof data?.agreement_notice_after_term_body === "string" && data.agreement_notice_after_term_body.trim() !== ""
          ? data.agreement_notice_after_term_body
          : null,
    };
    return NextResponse.json({ theme, homepage_mode: homepageMode, branding }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
