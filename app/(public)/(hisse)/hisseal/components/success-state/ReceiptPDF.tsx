/* eslint-disable jsx-a11y/alt-text */
// This file uses react-pdf's Image component which doesn't support alt attributes

import { getDeliveryTypeDisplayLabel } from '@/lib/delivery-options';
import { getLogoBase64ForSlug } from '@/lib/logoBase64';
import {
  getElyaCuttingArrivalNoteLines,
  shouldShowElyaCuttingArrivalNote,
} from '@/lib/receipt-cutting-note';
import {
  formatReceiptKilogramDisplay,
  hasReceiptReservationCode,
  isPurchaseReceiptTotalFinalized,
  RECEIPT_SACRIFICE_NUMBER_LABEL,
  shouldShowReceiptTotalAmountRow,
} from '@/lib/purchase-receipt-data';
import {
  buildReceiptReminders,
  parseReceiptTlAmountString,
} from '@/lib/receipt-reminders';
import type { TenantBranding } from '@/lib/tenant-branding';
import { DEFAULT_BRANDING } from '@/lib/tenant-branding-defaults';
import { formatDateWithSeconds } from "@/lib/date-utils";
import { Document, Font, Image, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { useMemo } from "react";

// Register OpenSans font from local files
Font.register({
  family: 'OpenSans',
  fonts: [
    { src: '/fonts/InstrumentSans-Regular.ttf' }, // Use existing font
    { src: '/fonts/InstrumentSans-Bold.ttf', fontWeight: 'bold' } // Bold version
  ]
});

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'OpenSans',
    fontSize: 11,
    lineHeight: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerSpacer: {
    width: '28%',
  },
  headerLogoWrap: {
    width: '44%',
    flexDirection: 'column',
    alignItems: 'center',
  },
  belgeOlusturulma: {
    width: '28%',
    alignItems: 'flex-end',
    fontSize: 8,
    color: '#666666',
    textAlign: 'right',
    lineHeight: 1.35,
  },
  paymentDivider: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 6,
    marginBottom: 6,
    paddingTop: 6,
  },
  logo: {
    width: 150,
  },
  /** Elya logosu PDF’te daha geniş; yarı genişlikte gösterilir. */
  logoElya: {
    width: 75,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  intro: {
    fontSize: 11,
    marginBottom: 20,
    textAlign: 'center',
    color: '#555555',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  label: {
    minWidth: 100,
    marginRight: 4,
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
  },
  valueSubnote: {
    marginTop: 2,
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.35,
  },
  twoColumnLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  column: {
    width: '48%',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
    padding: 5,
    borderRadius: 3,
  },
  warning: {
    backgroundColor: '#fff8e1',
    padding: 10,
    borderRadius: 3,
    marginTop: 10,
    marginBottom: 10,
    fontSize: 10,
  },
  warningText: {
    color: '#ff9800',
    fontWeight: 'bold',
    marginBottom: 3,
  },
  importantInfoSection: {
    marginTop: 15,
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 3,
    borderLeft: '3 solid #39C645',
  },
  importantInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  importantInfoItem: {
    marginBottom: 8,
  },
  importantInfoHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#333',
  },
  importantInfoText: {
    fontSize: 10,
    color: '#555',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    fontSize: 9,
    color: '#666666',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
  },
  footerText: {
    marginBottom: 3,
  },
  contact: {
    marginTop: 5,
    fontSize: 9,
    color: '#666666',
  },
  websiteLink: {
    color: '#2563eb',
    textDecoration: 'underline',
  },
});

// Format price with thousand separators
const formatPrice = (price: string): string => {
  if (!price) return '';

  const numPrice = parseFloat(price.replace(/[^\d.-]/g, ''));
  if (isNaN(numPrice)) return price;

  return numPrice.toLocaleString('tr-TR') + ' TL';
};

// Create Document Component
interface ReceiptPDFProps {
  branding?: TenantBranding | null;
  /** Admin PDF vb.: boş değilse PDF’te kapora tutarı bu değerle gösterilir (tenant varsayılanının üzerine). */
  depositAmountOverride?: number | null;
  /**
   * Admin PDF: kapora alanı boşken `data.effective_deposit_tl` (notlardan parse) yerine
   * tenant `deposit_amount` kullanılır — diyalogdaki “varsayılan tenant kapora” ile uyumlu.
   */
  preferTenantDepositForKaporaReminders?: boolean;
  data: {
    // Hisse Sahibi Bilgileri
    shareholder_name: string;
    phone_number: string;
    second_phone_number?: string;
    email?: string;
    delivery_type: string;
    delivery_location: string;
    vekalet_durumu: string;

    // Hisse ve Ödeme Özeti
    share_price: string;
    delivery_fee: string;
    total_amount: string;
    paid_amount: string;
    remaining_payment: string;
    purchase_time: string;
    sacrifice_consent: boolean;

    // Hayvana Ait Bilgiler
    sacrifice_no: string;
    sacrifice_time: string;
    share_weight: string;

    // Rezervasyon Takibi ve Güvenlik
    transaction_id: string;
    security_code: string;
    effective_deposit_tl: number;
  };
}

export const ReceiptPDF = ({
  data,
  branding,
  depositAmountOverride,
  preferTenantDepositForKaporaReminders = false,
}: ReceiptPDFProps) => {
  const baseBranding = branding ?? DEFAULT_BRANDING;
  const effectiveBranding =
    depositAmountOverride != null && Number.isFinite(Number(depositAmountOverride))
      ? { ...baseBranding, deposit_amount: Number(depositAmountOverride) }
      : baseBranding;
  const showElyaCuttingNote = shouldShowElyaCuttingArrivalNote(
    effectiveBranding.logo_slug,
    data.delivery_type
  );
  const [cuttingNoteLine1, cuttingNoteLine2] = getElyaCuttingArrivalNoteLines();
  const logoSlug = effectiveBranding.logo_slug ?? "ankara-kurban";

  const deliveryFeeNum = parseReceiptTlAmountString(data.delivery_fee);
  const showDeliveryFeeRow = deliveryFeeNum > 0;
  const isAdminKaporaWaived =
    depositAmountOverride != null &&
    Number.isFinite(Number(depositAmountOverride)) &&
    Number(depositAmountOverride) === 0;
  const documentGeneratedAtLabel = useMemo(
    () => formatDateWithSeconds(new Date()),
    []
  );
  const logoBase64 = getLogoBase64ForSlug(logoSlug);
  const logoStyle =
    logoSlug === "elya-hayvancilik" ? styles.logoElya : styles.logo;
  const depositTlForReminders =
    depositAmountOverride != null && Number.isFinite(Number(depositAmountOverride))
      ? Number(depositAmountOverride)
      : preferTenantDepositForKaporaReminders
        ? baseBranding.deposit_amount
        : data.effective_deposit_tl;
  const paidTl = parseReceiptTlAmountString(data.paid_amount);
  const remindersList = buildReceiptReminders(effectiveBranding, {
    kaporaWaived: isAdminKaporaWaived,
    paidAmountTl: paidTl,
    depositExpectedTl: depositTlForReminders,
  });
  const odemeTotalsFinalized = isPurchaseReceiptTotalFinalized(data);
  const showTotalAmountRow = shouldShowReceiptTotalAmountRow(data, showDeliveryFeeRow);
  const showReservationCodeRow = hasReceiptReservationCode(data.transaction_id);
  const websiteUrl = effectiveBranding.website_url || "ankarakurban.com.tr";
  const contactPhone = effectiveBranding.contact_phone || "0552 652 90 00 / 0312 312 44 64";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Logo + belge tarihi (sağ üst) */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <View style={styles.headerLogoWrap}>
            {/* alt attribute not supported by react-pdf's Image component */}
            <Image src={logoBase64} style={logoStyle} />
          </View>
          <View style={styles.belgeOlusturulma}>
            <Text>Belge oluşturulma</Text>
            <Text>{documentGeneratedAtLabel}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Kurban Hisse Seçimi İşlem Özeti</Text>

        {/* Intro Message */}
        <Text style={styles.intro}>
          Bu güzel ibadeti gönül rahatlığıyla yerine getirmenize yardımcı olmaktan büyük mutluluk duyuyoruz.{"\n"}Aşağıda hisse işleminize ait tüm detayları bulabilirsiniz.
        </Text>

        {/* First row of sections: 1 and 3 side by side */}
        <View style={styles.twoColumnLayout}>
          {/* 1. Hisse Sahibi Bilgileri */}
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Hisse Sahibi Bilgileri</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Ad Soyad:</Text>
              <Text style={styles.value}>{data.shareholder_name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Telefon:</Text>
              <Text style={styles.value}>{data.phone_number}</Text>
            </View>
            {data.second_phone_number && (
              <View style={styles.row}>
                <Text style={styles.label}>İkinci Telefon:</Text>
                <Text style={styles.value}>{data.second_phone_number}</Text>
              </View>
            )}
            {data.email && (
              <View style={styles.row}>
                <Text style={styles.label}>E-posta:</Text>
                <Text style={styles.value}>{data.email}</Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={styles.label}>Teslimat Tercihi:</Text>
              <Text style={styles.value}>{getDeliveryTypeDisplayLabel(effectiveBranding.logo_slug ?? "ankara-kurban", data.delivery_type, null, false)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Teslimat Yeri:</Text>
              <Text style={styles.value}>{data.delivery_location && data.delivery_location !== "-" ? data.delivery_location : "-"}</Text>
            </View>
          </View>

          {/* 3. Hayvana Ait Bilgiler */}
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Kurbanlık Bilgileri</Text>
            <View style={styles.row}>
              <Text style={styles.label}>{RECEIPT_SACRIFICE_NUMBER_LABEL}:</Text>
              <Text style={styles.value}>{data.sacrifice_no}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Kesim Zamanı:</Text>
              <Text style={styles.value}>
                {data.sacrifice_time}
                {showElyaCuttingNote ? (
                  <Text style={styles.valueSubnote}>
                    {"\n"}
                    {cuttingNoteLine1}
                    {"\n"}
                    {cuttingNoteLine2}
                  </Text>
                ) : null}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Kilogram:</Text>
              <Text style={styles.value}>{formatReceiptKilogramDisplay(data.share_weight)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Satın Alma Tarihi:</Text>
              <Text style={styles.value}>{data.purchase_time}</Text>
            </View>
          </View>
        </View>

        {/* Second row: Ödeme + Rezervasyon/Güvenlik (rezervasyon kodu satırı yalnızca kod varsa) */}
        <View style={styles.twoColumnLayout}>
          {/* 2. Hisse ve Ödeme Özeti */}
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Ödeme Bilgileri</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Hisse Fiyatı:</Text>
              <Text style={styles.value}>{formatPrice(data.share_price)}</Text>
            </View>
            {showDeliveryFeeRow ? (
              <View style={styles.row}>
                <Text style={styles.label}>Teslimat Ücreti:</Text>
                <Text style={styles.value}>{formatPrice(data.delivery_fee)}</Text>
              </View>
            ) : null}
            {showTotalAmountRow ? (
              <View style={styles.row}>
                <Text style={styles.label}>Toplam Tutar:</Text>
                <Text style={styles.value}>{formatPrice(data.total_amount)}</Text>
              </View>
            ) : null}
            <View style={styles.paymentDivider}>
              <View style={styles.row}>
                <Text style={styles.label}>Ödenen Tutar:</Text>
                <Text style={styles.value}>{formatPrice(data.paid_amount)}</Text>
              </View>
              {odemeTotalsFinalized ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Kalan Tutar:</Text>
                  <Text style={styles.value}>{formatPrice(data.remaining_payment)}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.column}>
            <Text style={styles.sectionTitle}>
              Rezervasyon Takibi ve Güvenlik
            </Text>
            {showReservationCodeRow ? (
              <View style={styles.row}>
                <Text style={styles.label}>Rezervasyon Kodu:</Text>
                <Text style={styles.value}>{data.transaction_id}</Text>
              </View>
            ) : null}
            <View style={styles.row}>
              <Text style={styles.label}>Güvenlik Kodu:</Text>
              <Text style={styles.value}>{data.security_code}</Text>
            </View>
          </View>
        </View>

        {/* Warning - at the bottom */}
        <View style={styles.warning}>
          <Text style={styles.warningText}>⚠️ Önemli Notlar:</Text>
          <Text>
            Güvenlik kodu hissenizi güvenli bir şekilde sorgulamayabilmeniz için
            gerekmektedir.{"\n"}
            Lütfen kodunuzu kimse ile paylaşmayınız.
          </Text>

          {/* Add empty line before reminders */}
          <Text>{"\n"}</Text>

          {/* Render reminders with bullet points */}
          {remindersList.map((reminder, index) => (
            <View key={index} style={{ marginBottom: 5 }}>
              <Text>
                • <Text style={{ fontWeight: 'bold' }}>{reminder.header}:</Text> {reminder.description.replace(/<br\s*\/?>/gi, " ")}
              </Text>
            </View>
          ))}
        </View>

        {/* 5. Kapanış Mesajı */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Bu belge bilgilendirme amaçlıdır. Lütfen bilgilerinizi kontrol ediniz.
          </Text>
          <Text style={styles.footerText}>
            Detaylı bilgiler için {' '}
            <Link src={`https://www.${websiteUrl}/`} style={styles.websiteLink}>
              www.{websiteUrl}
            </Link> {' '}
            adresine göz atınız.
          </Text>
          <Text style={styles.contact}>
            Destek: {contactPhone}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default ReceiptPDF; 