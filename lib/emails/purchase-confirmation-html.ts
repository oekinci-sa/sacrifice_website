/** Hisse tamamlandıktan sonra otomatik gönderilen e-posta — PDF (ReceiptPDF) ile aynı içerik düzeni. */

import { getDeliveryTypeDisplayLabel } from "@/lib/delivery-options";
import {
  EMAIL_FONT_FAMILY_INSTRUMENT_STACK,
  EMAIL_INSTRUMENT_SANS_HEAD_LINKS,
} from "@/lib/email-font-stack";
import {
  getAnkaraDarkModeLogoUrlForEmail,
  getLogoAbsoluteUrlForEmail,
} from "@/lib/email-logo-url";
import { getLogoBase64ForSlug } from "@/lib/logoBase64";
import {
  getElyaCuttingArrivalNoteLines,
  shouldShowElyaCuttingArrivalNote,
} from "@/lib/receipt-cutting-note";
import {
  formatReceiptKilogramDisplay,
  hasReceiptReservationCode,
  isPurchaseReceiptTotalFinalized,
  shouldShowReceiptTotalAmountRow,
  type PurchaseReceiptPdfLikeData,
} from "@/lib/purchase-receipt-data";
import { formatDateWithSeconds } from "@/lib/date-utils";
import {
  buildReceiptReminders,
  parseReceiptTlAmountString,
} from "@/lib/receipt-reminders";
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
  /** E-posta/PDF üretim anı; verilmezse `new Date()` */
  documentGeneratedAt?: Date;
}): { html: string; text: string } {
  const { tenantName, branding, receipt, documentGeneratedAt } = params;
  const generatedAt = documentGeneratedAt ?? new Date();
  const documentGeneratedAtFormatted = formatDateWithSeconds(generatedAt);
  const slug = branding.logo_slug;
  const logoLightHttps = getLogoAbsoluteUrlForEmail(slug, branding.website_url);
  const logoDarkHttps =
    slug === "ankara-kurban"
      ? getAnkaraDarkModeLogoUrlForEmail(branding.website_url)
      : "";
  const logoFallback = getLogoBase64ForSlug(slug);
  const logoWidthPx = slug === "elya-hayvancilik" ? 75 : 150;
  const elyaClass = slug === "elya-hayvancilik" ? " email-logo-elya" : "";

  const deliveryTypeLabel = getDeliveryTypeDisplayLabel(
    slug,
    receipt.delivery_type,
    null,
    false
  );

  const paidTl = parseReceiptTlAmountString(receipt.paid_amount);
  const remindersList = buildReceiptReminders(branding, {
    kaporaWaived: false,
    paidAmountTl: paidTl,
    depositExpectedTl: receipt.effective_deposit_tl,
  });
  const showElyaCuttingNote = shouldShowElyaCuttingArrivalNote(
    slug,
    receipt.delivery_type
  );
  const [cuttingNoteLine1, cuttingNoteLine2] = getElyaCuttingArrivalNoteLines();

  const websiteUrl = branding.website_url || "ankarakurban.com.tr";
  const contactPhone = branding.contact_phone || "";

  const fmt = (s: string) => escapeHtml(s);
  const cuttingTimeValueHtml = `${fmt(receipt.sacrifice_time || "-")}${
    showElyaCuttingNote
      ? `<div style="margin-top:2px;font-size:12px;line-height:1.35;color:#6b7280;">${fmt(
          cuttingNoteLine1
        )}<br />${fmt(cuttingNoteLine2)}</div>`
      : ""
  }`;

  const logoImgs =
    logoLightHttps && slug === "ankara-kurban" && logoDarkHttps
      ? `<img class="email-logo-img email-logo-light${elyaClass}" src="${fmt(logoLightHttps)}" alt="${fmt(tenantName)}" width="${logoWidthPx}" style="display:block;margin:0 auto;max-width:100%;height:auto;border:0;outline:none;" />
            <img class="email-logo-img email-logo-dark${elyaClass}" src="${fmt(logoDarkHttps)}" alt="" width="${logoWidthPx}" style="display:none;margin:0 auto;max-width:100%;height:auto;border:0;outline:none;" />`
      : `<img class="email-logo-img${elyaClass}" src="${fmt(logoLightHttps || logoFallback)}" alt="${fmt(tenantName)}" width="${logoWidthPx}" style="display:block;margin:0 auto;max-width:100%;height:auto;border:0;outline:none;" />`;

  const logoRow = `<tr>
    <td style="padding:24px 20px 12px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="28%" valign="top"></td>
          <td width="44%" align="center" valign="top">${logoImgs}</td>
          <td width="28%" valign="top" align="right" style="font-size:11px;line-height:1.35;color:#6b7280;">
            Belge oluşturulma<br />${fmt(documentGeneratedAtFormatted)}
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

  const deliveryFeeNum = parseReceiptTlAmountString(receipt.delivery_fee);
  const showDeliveryFeeRow = deliveryFeeNum > 0;
  const odemeTotalsFinalized = isPurchaseReceiptTotalFinalized(receipt);
  const showTotalAmountRow = shouldShowReceiptTotalAmountRow(receipt, showDeliveryFeeRow);
  const showReservationCodeRow = hasReceiptReservationCode(receipt.transaction_id);
  const odemeBlockHtml =
    rowsHtml([
      ["Hisse Fiyatı", formatPrice(receipt.share_price)],
      ...(showDeliveryFeeRow
        ? ([["Teslimat Ücreti", formatPrice(receipt.delivery_fee)]] as [string, string][])
        : []),
      ...(showTotalAmountRow
        ? ([["Toplam Tutar", formatPrice(receipt.total_amount)]] as [string, string][])
        : []),
    ]) +
    `<tr><td colspan="2" style="border-top:1px solid #e5e7eb;padding:8px 0 0 0;"></td></tr>` +
    rowHtml("Ödenen Tutar", formatPrice(receipt.paid_amount)) +
    (odemeTotalsFinalized
      ? rowHtml("Kalan Tutar", formatPrice(receipt.remaining_payment))
      : "");

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
${EMAIL_INSTRUMENT_SANS_HEAD_LINKS}
<title>${fmt(tenantName)} — İşlem özeti</title>
<style type="text/css">
  body, table, td, p, a, li, span, strong {
    font-family: ${EMAIL_FONT_FAMILY_INSTRUMENT_STACK};
  }
  .email-logo-img { width: 150px; max-width: 100%; height: auto; }
  .email-logo-img.email-logo-elya { width: 75px; }
  @media only screen and (min-width: 600px) {
    .email-logo-img { width: 300px !important; }
    .email-logo-img.email-logo-elya { width: 150px !important; }
  }
  @media (prefers-color-scheme: dark) {
    .email-logo-light { display: none !important; }
    .email-logo-dark { display: block !important; }
  }
  @media only screen and (max-width: 600px) {
    .email-outer { padding: 16px 8px !important; }
    .email-card { border-radius: 0 !important; }
    .email-pad { padding: 16px !important; }
    .email-title { font-size: 18px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:${EMAIL_FONT_FAMILY_INSTRUMENT_STACK};line-height:1.5;color:#111827;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
  <tr>
    <td class="email-outer" align="center" style="padding:24px 12px;">
      <table role="presentation" class="email-card" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;">
        ${logoRow}
        <tr>
          <td class="email-pad" style="padding:0 20px 8px 20px;">
            <p style="margin:0 0 8px 0;font-size:15px;color:#374151;">Kıymetli hissedarımız ${fmt(receipt.shareholder_name)},</p>
            <p class="email-title" style="margin:0 0 12px 0;font-size:20px;font-weight:700;text-align:center;color:#111827;">Kurban Hisse Seçimi İşlem Özeti</p>
            <p style="margin:0 0 20px 0;font-size:13px;color:#6b7280;text-align:center;">Bu güzel ibadeti gönül rahatlığıyla yerine getirmenize yardımcı olmaktan büyük mutluluk duyuyoruz.<br />Aşağıda hisse işleminize ait tüm detayları bulabilirsiniz.</p>
          </td>
        </tr>
        ${sectionBlock("Hisse Sahibi Bilgileri", rowsHtml(hisseSahibiRows))}
        ${sectionBlock(
          "Kurbanlık Bilgileri",
          rowHtml("Hayvan No", receipt.sacrifice_no) +
            rowHtmlRawValue("Kesim Zamanı", cuttingTimeValueHtml) +
            rowHtml("Kilogram", formatReceiptKilogramDisplay(receipt.share_weight)) +
            rowHtml("Satın Alma Tarihi", receipt.purchase_time)
        )}
        ${sectionBlock("Ödeme Bilgileri", odemeBlockHtml)}
        ${sectionBlock(
          "Rezervasyon Takibi ve Güvenlik",
          rowsHtml([
            ...(showReservationCodeRow
              ? ([["Rezervasyon Kodu", receipt.transaction_id]] as [string, string][])
              : []),
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
    branding,
    receipt,
    deliveryTypeLabel,
    remindersList,
    websiteUrl,
    contactPhone,
    documentGeneratedAtFormatted,
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
  return pairs.map(([label, value]) => rowHtml(label, value)).join("");
}

function rowHtml(label: string, value: string): string {
  return `<tr>
  <td style="padding:4px 8px 4px 0;vertical-align:top;font-weight:bold;color:#374151;width:42%;">${escapeHtml(label)}:</td>
  <td style="padding:4px 0;vertical-align:top;color:#111827;word-break:break-word;">${escapeHtml(value)}</td>
</tr>`
}

function rowHtmlRawValue(label: string, valueHtml: string): string {
  return `<tr>
  <td style="padding:4px 8px 4px 0;vertical-align:top;font-weight:bold;color:#374151;width:42%;">${escapeHtml(label)}:</td>
  <td style="padding:4px 0;vertical-align:top;color:#111827;word-break:break-word;">${valueHtml}</td>
</tr>`;
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
  branding: TenantBranding;
  receipt: PurchaseReceiptPdfLikeData;
  deliveryTypeLabel: string;
  remindersList: { header: string; description: string }[];
  websiteUrl: string;
  contactPhone: string;
  documentGeneratedAtFormatted: string;
}): string {
  const {
    tenantName,
    branding,
    receipt,
    deliveryTypeLabel,
    remindersList,
    websiteUrl,
    contactPhone,
    documentGeneratedAtFormatted,
  } = params;
  const showElyaCuttingNote = shouldShowElyaCuttingArrivalNote(
    branding.logo_slug,
    receipt.delivery_type
  );
  const [cuttingNoteLine1, cuttingNoteLine2] = getElyaCuttingArrivalNoteLines();
  const deliveryFeeNumPlain = parseReceiptTlAmountString(receipt.delivery_fee);
  const showDeliveryFeeRowPlain = deliveryFeeNumPlain > 0;
  const odemeTotalsFinalizedPlain = isPurchaseReceiptTotalFinalized(receipt);
  const showTotalAmountRowPlain = shouldShowReceiptTotalAmountRow(
    receipt,
    showDeliveryFeeRowPlain
  );
  const showReservationCodeRowPlain = hasReceiptReservationCode(receipt.transaction_id);
  const lines: string[] = [
    `Kıymetli hissedarımız ${receipt.shareholder_name},`,
    "",
    `Belge oluşturulma: ${documentGeneratedAtFormatted}`,
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
    ...(showElyaCuttingNote ? [cuttingNoteLine1, cuttingNoteLine2] : []),
    `Kilogram: ${formatReceiptKilogramDisplay(receipt.share_weight)}`,
    `Satın Alma Tarihi: ${receipt.purchase_time}`,
    "",
    "--- Ödeme Bilgileri ---",
    `Hisse Fiyatı: ${formatPrice(receipt.share_price)}`,
    ...(showDeliveryFeeRowPlain
      ? [`Teslimat Ücreti: ${formatPrice(receipt.delivery_fee)}`]
      : []),
    ...(showTotalAmountRowPlain
      ? [`Toplam Tutar: ${formatPrice(receipt.total_amount)}`]
      : []),
    "---",
    `Ödenen Tutar: ${formatPrice(receipt.paid_amount)}`,
    ...(odemeTotalsFinalizedPlain
      ? [`Kalan Tutar: ${formatPrice(receipt.remaining_payment)}`]
      : []),
    ""
  );
  lines.push("--- Rezervasyon Takibi ve Güvenlik ---");
  if (showReservationCodeRowPlain) {
    lines.push(`Rezervasyon Kodu: ${receipt.transaction_id}`);
  }
  lines.push(`Güvenlik Kodu: ${receipt.security_code}`, "");
  lines.push("Önemli Notlar:");
  lines.push(
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
