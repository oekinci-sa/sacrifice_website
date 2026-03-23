/** Hisse tamamlandıktan sonra otomatik gönderilen e-posta — PDF (ReceiptPDF) ile aynı içerik düzeni. */

import { reminders } from "@/app/(public)/(hisse)/constants";
import { getDeliveryTypeDisplayLabel } from "@/lib/delivery-options";
import { getLogoBase64ForSlug } from "@/lib/logoBase64";
import type { PurchaseReceiptPdfLikeData } from "@/lib/purchase-receipt-data";
import type { TenantBranding } from "@/lib/tenant-branding";

/** E-posta konusu ve gövdede marka adı (DB `tenants.name` değil, logo_slug ile). */
export function getPurchaseConfirmationTenantDisplayName(logoSlug: string): string {
  if (logoSlug === "elya-hayvancilik") return "Elya Hayvancılık";
  if (logoSlug === "ankara-kurban") return "Ankara Kurban";
  return "Kurban Organizasyonu";
}

export function buildPurchaseConfirmationHtml(params: {
  tenantName: string;
  branding: TenantBranding;
  receipt: PurchaseReceiptPdfLikeData;
}): { html: string; text: string } {
  const { tenantName, branding, receipt } = params;
  const slug = branding.logo_slug;
  const logoDataUrl = getLogoBase64ForSlug(slug);
  const logoWidthPx = slug === "elya-hayvancilik" ? 75 : 150;

  const deliveryTypeLabel = getDeliveryTypeDisplayLabel(
    slug,
    receipt.delivery_type,
    null,
    false
  );

  const remindersList = reminders.map((r, i) =>
    i === 1 && branding.iban ? { ...r, description: branding.iban } : r
  );

  const websiteUrl = branding.website_url || "ankarakurban.com.tr";
  const contactPhone = branding.contact_phone || "";

  const fmt = (s: string) => escapeHtml(s);

  const hisseSahibiRows: [string, string][] = [
    ["Ad Soyad", receipt.shareholder_name],
    ["Telefon", receipt.phone_number],
  ];
  if (receipt.second_phone_number) {
    hisseSahibiRows.push(["İkinci Telefon", receipt.second_phone_number]);
  }
  if (receipt.email) {
    hisseSahibiRows.push(["E-posta", receipt.email]);
  }
  hisseSahibiRows.push(
    ["Teslimat Tercihi", deliveryTypeLabel],
    [
      "Teslimat Yeri",
      receipt.delivery_location && receipt.delivery_location !== "-"
        ? receipt.delivery_location
        : "-",
    ]
  );

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>${fmt(tenantName)} — İşlem özeti</title>
<style type="text/css">
  @media only screen and (max-width: 600px) {
    .email-outer { padding: 16px 8px !important; }
    .email-card { border-radius: 0 !important; }
    .email-pad { padding: 16px !important; }
    .email-title { font-size: 18px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.5;color:#111827;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
  <tr>
    <td class="email-outer" align="center" style="padding:24px 12px;">
      <table role="presentation" class="email-card" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr>
          <td style="padding:24px 20px 12px 20px;text-align:center;">
            <img src="${logoDataUrl}" alt="" width="${logoWidthPx}" height="auto" style="display:block;margin:0 auto;max-width:100%;height:auto;width:${logoWidthPx}px;" />
          </td>
        </tr>
        <tr>
          <td class="email-pad" style="padding:0 20px 8px 20px;">
            <p style="margin:0 0 8px 0;font-size:15px;color:#374151;">Merhaba ${fmt(receipt.shareholder_name)},</p>
            <p class="email-title" style="margin:0 0 12px 0;font-size:20px;font-weight:700;text-align:center;color:#111827;">Kurban Hisse Seçimi İşlem Özeti</p>
            <p style="margin:0 0 20px 0;font-size:13px;color:#6b7280;text-align:center;">Bu güzel ibadeti gönül rahatlığıyla yerine getirmenize yardımcı olmaktan büyük mutluluk duyuyoruz.<br />Aşağıda hisse işleminize ait tüm detayları bulabilirsiniz.</p>
          </td>
        </tr>
        ${sectionBlock("Hisse Sahibi Bilgileri", rowsHtml(hisseSahibiRows))}
        ${sectionBlock(
          "Kurbanlık Bilgileri",
          rowsHtml([
            ["Hayvan No", receipt.sacrifice_no],
            ["Kesim Zamanı", receipt.sacrifice_time || "-"],
            ["Kilogram", receipt.share_weight ? `${receipt.share_weight} ±3 kg` : "-"],
          ])
        )}
        ${sectionBlock(
          "Ödeme Bilgileri",
          rowsHtml([
            ["Hisse Fiyatı", formatPrice(receipt.share_price)],
            ["Teslimat Ücreti", formatPrice(receipt.delivery_fee)],
            ["Toplam Tutar", formatPrice(receipt.total_amount)],
            ["Satın Alma Tarihi", receipt.purchase_time],
          ])
        )}
        ${sectionBlock(
          "Rezervasyon Takibi ve Güvenlik",
          rowsHtml([
            ["Rezervasyon Kodu", receipt.transaction_id],
            ["Güvenlik Kodu", receipt.security_code],
          ])
        )}
        <tr>
          <td class="email-pad" style="padding:0 20px 16px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border-radius:6px;border:1px solid #fde68a;">
              <tr>
                <td style="padding:14px 16px;font-size:13px;color:#92400e;">
                  <p style="margin:0 0 8px 0;font-weight:bold;color:#d97706;">⚠️ Önemli Notlar:</p>
                  <p style="margin:0 0 10px 0;">Güvenlik kodu hissenizi güvenli bir şekilde sorgulamayabilmeniz için gerekmektedir.<br />Lütfen kodunuzu kimse ile paylaşmayınız.</p>
                  ${remindersList
                    .map(
                      (rem) =>
                        `<p style="margin:8px 0 0 0;">• <strong>${fmt(rem.header)}:</strong> ${fmt(rem.description.replace(/<br\s*\/?>/gi, " "))}</p>`
                    )
                    .join("")}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="email-pad" style="padding:0 20px 24px 20px;border-top:1px solid #e5e7eb;">
            <p style="margin:16px 0 6px 0;font-size:12px;color:#6b7280;">Bu belge bilgilendirme amaçlıdır. Lütfen bilgilerinizi kontrol ediniz.</p>
            <p style="margin:0 0 6px 0;font-size:12px;color:#6b7280;">Detaylı bilgiler için <a href="https://www.${fmt(websiteUrl)}/" style="color:#2563eb;">www.${fmt(websiteUrl)}</a> adresine göz atınız.</p>
            <p style="margin:0;font-size:12px;color:#6b7280;">Destek: ${fmt(contactPhone)}</p>
            <p style="margin:16px 0 0 0;font-size:11px;color:#9ca3af;">Bu e-posta otomatik gönderilmiştir.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`.trim();

  const text = buildPlainText({
    tenantName,
    receipt,
    deliveryTypeLabel,
    remindersList,
    websiteUrl,
    contactPhone,
  });

  return { html, text };
}

function sectionBlock(title: string, innerRows: string): string {
  return `<tr>
  <td class="email-pad" style="padding:0 20px 16px 20px;">
    <p style="margin:0 0 10px 0;font-size:14px;font-weight:bold;color:#111827;background:#f3f4f6;padding:8px 10px;border-radius:4px;">${escapeHtml(title)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">${innerRows}</table>
  </td>
</tr>`;
}

function rowsHtml(pairs: ReadonlyArray<[string, string]>): string {
  return pairs
    .map(
      ([label, value]) => `<tr>
  <td style="padding:4px 8px 4px 0;vertical-align:top;font-weight:bold;color:#374151;width:42%;">${escapeHtml(label)}:</td>
  <td style="padding:4px 0;vertical-align:top;color:#111827;word-break:break-word;">${escapeHtml(value)}</td>
</tr>`
    )
    .join("");
}

function formatPrice(price: string): string {
  if (!price) return "";
  const numPrice = parseFloat(price.replace(/[^\d.-]/g, ""));
  if (Number.isNaN(numPrice)) return price;
  return numPrice.toLocaleString("tr-TR") + " TL";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildPlainText(params: {
  tenantName: string;
  receipt: PurchaseReceiptPdfLikeData;
  deliveryTypeLabel: string;
  remindersList: { header: string; description: string }[];
  websiteUrl: string;
  contactPhone: string;
}): string {
  const { tenantName, receipt, deliveryTypeLabel, remindersList, websiteUrl, contactPhone } =
    params;
  const lines: string[] = [
    `Merhaba ${receipt.shareholder_name},`,
    "",
    `${tenantName} — Kurban Hisse Seçimi İşlem Özeti`,
    "",
    "Bu güzel ibadeti gönül rahatlığıyla yerine getirmenize yardımcı olmaktan büyük mutluluk duyuyoruz.",
    "Aşağıda hisse işleminize ait tüm detayları bulabilirsiniz.",
    "",
    "--- Hisse Sahibi Bilgileri ---",
    `Ad Soyad: ${receipt.shareholder_name}`,
    `Telefon: ${receipt.phone_number}`,
  ];
  if (receipt.second_phone_number) {
    lines.push(`İkinci Telefon: ${receipt.second_phone_number}`);
  }
  if (receipt.email) {
    lines.push(`E-posta: ${receipt.email}`);
  }
  lines.push(
    `Teslimat Tercihi: ${deliveryTypeLabel}`,
    `Teslimat Yeri: ${
      receipt.delivery_location && receipt.delivery_location !== "-"
        ? receipt.delivery_location
        : "-"
    }`,
    "",
    "--- Kurbanlık Bilgileri ---",
    `Hayvan No: ${receipt.sacrifice_no}`,
    `Kesim Zamanı: ${receipt.sacrifice_time || "-"}`,
    `Kilogram: ${receipt.share_weight ? `${receipt.share_weight} ±3 kg` : "-"}`,
    "",
    "--- Ödeme Bilgileri ---",
    `Hisse Fiyatı: ${formatPrice(receipt.share_price)}`,
    `Teslimat Ücreti: ${formatPrice(receipt.delivery_fee)}`,
    `Toplam Tutar: ${formatPrice(receipt.total_amount)}`,
    `Satın Alma Tarihi: ${receipt.purchase_time}`,
    "",
    "--- Rezervasyon Takibi ve Güvenlik ---",
    `Rezervasyon Kodu: ${receipt.transaction_id}`,
    `Güvenlik Kodu: ${receipt.security_code}`,
    "",
    "Önemli Notlar:",
    "Güvenlik kodu hissenizi güvenli bir şekilde sorgulamayabilmeniz için gerekmektedir.",
    "Lütfen kodunuzu kimse ile paylaşmayınız.",
    ""
  );
  for (const rem of remindersList) {
    lines.push(`• ${rem.header}: ${rem.description.replace(/<br\s*\/?>/gi, " ")}`);
  }
  lines.push(
    "",
    "Bu belge bilgilendirme amaçlıdır. Lütfen bilgilerinizi kontrol ediniz.",
    `Detaylı bilgiler için www.${websiteUrl}`,
    `Destek: ${contactPhone}`,
    "",
    "Bu e-posta otomatik gönderilmiştir."
  );
  return lines.join("\n");
}
