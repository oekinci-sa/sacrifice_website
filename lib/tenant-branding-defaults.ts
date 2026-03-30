/**
 * Tenant branding varsayılanları — istemci ve sunucu güvenli (supabase yok).
 * Gerçek değerler tenant_settings üzerinden gelir; burası yalnızca fallback.
 */

import type { ContactSocialLink } from "./contact-social-links";

export interface AgreementTerm {
  title: string;
  description: string;
}

export interface TenantBranding {
  tenant_id?: string | null;
  logo_slug: string;
  iban: string;
  /** IBAN sahibi; doluysa sitede/PDF/e-postada gösterilir. */
  iban_account_holder: string | null;
  website_url: string;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
  /** İletişim sayfası blok başlıkları (tenant_settings) */
  contact_address_label: string;
  contact_email_label: string;
  contact_phone_label: string;
  /** Sosyal medya; boşsa bölüm gösterilmez */
  contact_social_links: ContactSocialLink[];
  deposit_amount: number;
  deposit_deadline_days: number;
  full_payment_deadline_month: number;
  full_payment_deadline_day: number;
  /** Tam ödeme tarihinde haftanın günü için yıl (tenant_settings.active_sacrifice_year). */
  active_sacrifice_year: number | null;
  agreement_terms: AgreementTerm[];
  /** tenant_settings; boşsa DEFAULT_AGREEMENT_COPY kullanılır */
  agreement_dialog_title: string;
  agreement_main_heading: string;
  /** İki paragraf için \n\n ile ayırın */
  agreement_intro_text: string;
  agreement_footer_text: string;
  /**
   * Belirtilen madde başlığının hemen altında gösterilecek ek not (tenant’a özel).
   * İkisi de dolu değilse gösterilmez; başlık, agreement_terms içindeki title ile birebir (trim) eşleşmeli.
   */
  agreement_notice_after_term_title: string | null;
  agreement_notice_after_term_body: string | null;
}

/** Kod yedeği — DB’de ilgili sütunlar NULL ise kullanılır. */
export const DEFAULT_AGREEMENT_COPY = {
  agreement_dialog_title: "Bilgi notu ve onay",
  agreement_main_heading: "KURBAN HİSSEDARLARIMIZ İÇİN BİLGİ NOTU",
  agreement_intro_text:
    "Bu metin, kurban hissesi almak isteyenler ile bu organizasyonu gönüllülük esasıyla yürüten ekibimiz arasında, sürecin karşılıklı olarak şeffaf, anlaşılır ve düzenli ilerlemesini sağlamak amacıyla hazırlanmıştır. Amacımız, ibadet niyetiyle yapılan bu hizmetin sorunsuz ve güvenilir şekilde gerçekleşmesidir.\n\nLütfen aşağıdaki maddeleri dikkatlice okuyunuz. Hisse kaydı ve işlemleri sırasında bu şartları kabul etmiş olacaksınız.",
  agreement_footer_text:
    "Not: Bu hizmet gönüllülük esasıyla yürütülmekte olup, ibadetin paylaşılması ve kolaylaştırılması amacı taşımaktadır.\n\nSiz değerli hissedarlarımızın da bu anlayışla sürece katkı sağlaması bizler için kıymetlidir.\n\nAllah'tan kurbanınızı kabul etmesini niyaz ederiz.",
} as const;

/** DB’de agreement_terms yoksa; tutar/tarih sabit yazılmaz (tenant ayarlarından türetilir). */
export const DEFAULT_AGREEMENT_TERMS: AgreementTerm[] = [
  {
    title: "Ödeme ve Kapora",
    description:
      "Her hisse için hisse alımdan itibaren {{deposit_deadline_days}} gün içerisinde en az {{deposit_amount}}₺ kapora ödenmesi zorunludur. Kalan tutarın ise {{full_payment_deadline_day}} {{full_payment_month_name}} gününe kadar eksiksiz olarak tamamlanması gerekmektedir. Belirtilen tarihlere kadar ödeme tamamlanmazsa hisse hakkı iptal edilebilir.",
  },
  {
    title: "Vekalet ve Dini Usuller",
    description:
      "Hissedar, bu organizasyona katılarak kurban ibadetinin vekâleten gerçekleştirilmesini kabul etmiş sayılır. Kurban kesimi, İslami usullere ve hijyenik koşullara uygun olarak ehil kişilerce gerçekleştirilecektir.",
  },
  {
    title: "İptal ve İade Koşulları",
    description:
      "Kurban kesim tarihinden en az 1 ay önce yazılı olarak talepte bulunmanız halinde, hisse bedelinizin iadesi mümkündür. Kesim gününe 1 aydan daha kısa bir süre kaldıysa iade yapılamaz.",
  },
  {
    title: "Adres ve Bilgi Güncellemeleri",
    description:
      "Teslimat adresi veya iletişim bilgilerinizde bir değişiklik olduysa, bu bilgileri kesim gününden en az 3 gün önce bizimle paylaşmanız gerekmektedir. Aksi halde hissenizin size zamanında ve doğru şekilde ulaşması garanti edilemez.",
  },
  {
    title: "Bilgilendirme ve Takip",
    description:
      "Hisse kaydınızı, telefon numaranız ve güvenlik kodunuz ile \"Hisse Sorgula\" sayfası üzerinden görüntüleyebilirsiniz. Bayram günü ise web sitemizin ana sayfasında yayınlanacak \"Kurbanlık Takip Ekranı\" aracılığıyla, kesim, paylaştırma ve teslimat işlemleri sırasında hangi kurbanlık üzerinde işlem yapıldığını anlık olarak takip edebilirsiniz.",
  },
  {
    title: "Gizlilik ve Veri Güvenliği",
    description:
      "Paylaştığınız kişisel bilgiler sadece bu organizasyon kapsamında kullanılacak, hiçbir şekilde üçüncü şahıslarla paylaşılmayacaktır.",
  },
  {
    title: "Mücbir Sebep ve Gecikmeler",
    description:
      "Tüm süreci titizlikle planlıyor ve eksiksiz bir şekilde uygulamaya çalışıyoruz. Ancak hava durumu, ulaşım engelleri, elektrik kesintisi, arıza veya diğer öngörülemeyen sebeplerden dolayı kurban kesimi veya hisse teslimatında gecikmeler yaşanabilir. Böyle bir durumda en kısa sürede bilgilendirme yapılacaktır. İletişim kanallarınızın açık olmasını sağlayınız.",
  },
];

/** Kod yedeği; iletişim metinleri tenant_settings’tan gelmeli (boş fallback). */
export const DEFAULT_BRANDING: TenantBranding = {
  logo_slug: "ankara-kurban",
  iban: "Kapora için IBAN bilgisi daha sonra sizlerle paylaşılacaktır.",
  iban_account_holder: null,
  website_url: "",
  contact_phone: "",
  contact_email: "",
  contact_address: "",
  contact_address_label: "Adres",
  contact_email_label: "E-posta",
  contact_phone_label: "Telefon",
  contact_social_links: [],
  deposit_amount: 5000,
  deposit_deadline_days: 3,
  full_payment_deadline_month: 5,
  full_payment_deadline_day: 20,
  active_sacrifice_year: 2026,
  agreement_terms: DEFAULT_AGREEMENT_TERMS,
  agreement_dialog_title: DEFAULT_AGREEMENT_COPY.agreement_dialog_title,
  agreement_main_heading: DEFAULT_AGREEMENT_COPY.agreement_main_heading,
  agreement_intro_text: DEFAULT_AGREEMENT_COPY.agreement_intro_text,
  agreement_footer_text: DEFAULT_AGREEMENT_COPY.agreement_footer_text,
  agreement_notice_after_term_title: null,
  agreement_notice_after_term_body: null,
};
