/* eslint-disable jsx-a11y/alt-text */
// This file uses react-pdf's Image component which doesn't support alt attributes

import { reminders } from '@/app/(public)/(hisse)/constants';
import { logoBase64 } from '@/lib/logoBase64';
import { Document, Font, Image, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 150,
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
    borderLeft: '3 solid #4CAF50',
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
  data: {
    // Hisse Sahibi Bilgileri
    shareholder_name: string;
    phone_number: string;
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
  };
}

export const ReceiptPDF = ({ data }: ReceiptPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Logo */}
      <View style={styles.header}>
        {/* alt attribute not supported by react-pdf's Image component */}
        <Image src={logoBase64} style={styles.logo} />
      </View>

      {/* Title */}
      <Text style={styles.title}>Kurban Hisse Seçimi İşlem Özeti</Text>

      {/* Intro Message */}
      <Text style={styles.intro}>
        Kurban ibadetinizi yerine getirmenize yardımcı olduğumuz için teşekkür
        ederiz.{"\n"}
        Aşağıda hisse işleminize ait tüm detayları bulabilirsiniz.
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
          <View style={styles.row}>
            <Text style={styles.label}>Teslimat Noktası:</Text>
            <Text style={styles.value}>{data.delivery_location}</Text>
          </View>
        </View>

        {/* 3. Hayvana Ait Bilgiler */}
        <View style={styles.column}>
          <Text style={styles.sectionTitle}>Kurbanlık Bilgileri</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Hayvan No:</Text>
            <Text style={styles.value}>{data.sacrifice_no}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Kesim Zamanı:</Text>
            <Text style={styles.value}>{data.sacrifice_time}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Kilogram:</Text>
            <Text style={styles.value}>{data.share_weight} ±3 kg</Text>
          </View>
        </View>
      </View>

      {/* Second row of sections: 2 and 4 side by side */}
      <View style={styles.twoColumnLayout}>
        {/* 2. Hisse ve Ödeme Özeti */}
        <View style={styles.column}>
          <Text style={styles.sectionTitle}>Ödeme Bilgileri</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Hisse Fiyatı:</Text>
            <Text style={styles.value}>{formatPrice(data.share_price)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Teslimat Ücreti:</Text>
            <Text style={styles.value}>{formatPrice(data.delivery_fee)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Toplam Tutar:</Text>
            <Text style={styles.value}>{formatPrice(data.total_amount)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Satın Alma Tarihi:</Text>
            <Text style={styles.value}>{data.purchase_time}</Text>
          </View>
        </View>

        {/* 4. Rezervasyon Takibi ve Güvenlik */}
        <View style={styles.column}>
          <Text style={styles.sectionTitle}>
            Rezervasyon Takibi ve Güvenlik
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>Rezervasyon Kodu:</Text>
            <Text style={styles.value}>{data.transaction_id}</Text>
          </View>
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
        {reminders.map((reminder, index) => (
          <View key={index} style={{ marginBottom: 5 }}>
            <Text>
              • <Text style={{ fontWeight: 'bold' }}>{reminder.header}:</Text> {reminder.description.replace(/<br\/>/g, ' ')}
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
          <Link src="https://www.ankarakurban.com.tr/" style={styles.websiteLink}>
            www.ankarakurban.com.tr
          </Link> {' '}
          adresine göz atınız.
        </Text>
        <Text style={styles.contact}>
          Destek: 0552 652 90 00 / 0312 312 44 64
        </Text>
      </View>
    </Page>
  </Document>
);

export default ReceiptPDF; 