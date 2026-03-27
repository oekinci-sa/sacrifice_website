/**
 * Tenant branding varsayılanları — istemci ve sunucu güvenli (supabase yok).
 * Gerçek değerler tenant_settings üzerinden gelir; burası yalnızca fallback.
 */

export interface AgreementTerm {
  title: string;
  description: string;
}

export interface TenantBranding {
  tenant_id?: string | null;
  logo_slug: string;
  iban: string;
  website_url: string;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
  deposit_amount: number;
  deposit_deadline_days: number;
  full_payment_deadline_month: number;
  full_payment_deadline_day: number;
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

/** ankara-kurban temalı fallback; kapora tutarı DB ile uyumlu (5000). */
export const DEFAULT_BRANDING: TenantBranding = {
  logo_slug: "ankara-kurban",
  iban: "Kapora için IBAN bilgisi daha sonra sizlerle paylaşılacaktır.",
  website_url: "ankarakurban.com.tr",
  contact_phone: "0312 312 44 64 / 0552 652 90 00",
  contact_email: "iletisim@ankarakurban.com.tr",
  contact_address: "Hacı Bayram, Ulus, Adliye Sk. No:1 Altındağ/Ankara (09.00 - 18.00)",
  deposit_amount: 5000,
  deposit_deadline_days: 3,
  full_payment_deadline_month: 5,
  full_payment_deadline_day: 20,
  agreement_terms: DEFAULT_AGREEMENT_TERMS,
  agreement_dialog_title: DEFAULT_AGREEMENT_COPY.agreement_dialog_title,
  agreement_main_heading: DEFAULT_AGREEMENT_COPY.agreement_main_heading,
  agreement_intro_text: DEFAULT_AGREEMENT_COPY.agreement_intro_text,
  agreement_footer_text: DEFAULT_AGREEMENT_COPY.agreement_footer_text,
  agreement_notice_after_term_title: null,
  agreement_notice_after_term_body: null,
};
