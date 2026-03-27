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
}

/** DB’de agreement_terms yoksa; tutar/tarih sabit yazılmaz (tenant ayarlarından türetilir). */
export const DEFAULT_AGREEMENT_TERMS: AgreementTerm[] = [
  {
    title: "Ödeme ve Kapora",
    description:
      "Kapora ve tam ödeme süreleri, kayıt sırasında gösterilen tutar ve tarihlere tabidir. Belirtilen sürelerde ödeme tamamlanmazsa hisse hakkı iptal edilebilir.",
  },
  { title: "Vekalet ve Dini Usuller", description: "Hissedar, bu organizasyona katılarak kurban ibadetinin vekâleten gerçekleştirilmesini kabul etmiş sayılır. Kurban kesimi, İslami usullere ve hijyenik koşullara uygun olarak ehil kişilerce gerçekleştirilecektir." },
  { title: "İptal ve İade Koşulları", description: "Kurban kesim tarihinden en az 1 ay önce yazılı olarak talepte bulunmanız halinde, hisse bedelinizin iadesi mümkündür. Kesim gününe 1 aydan daha kısa bir süre kaldıysa iade yapılamaz." },
  { title: "Adres ve Bilgi Güncellemeleri", description: "Teslimat adresi veya iletişim bilgilerinizde bir değişiklik olduysa, bu bilgileri kesim gününden önce bizimle paylaşmanız gerekmektedir. Aksi halde hissenizin size zamanında ve doğru şekilde ulaşması garanti edilemez." },
  { title: "Bilgilendirme ve Takip", description: "Hisse kaydınızı, telefon numaranız ve güvenlik kodunuz ile \"Hisse Sorgula\" sayfası üzerinden görüntüleyebilirsiniz. Bayram günü ise web sitemizin ana sayfasında yayınlanacak \"Kurbanlık Takip Ekranı\" aracılığıyla, kesim, paylaştırma ve teslimat işlemleri sırasında hangi kurbanlık üzerinde işlem yapıldığını anlık olarak takip edebilirsiniz." },
  { title: "Gizlilik ve Veri Güvenliği", description: "Paylaştığınız kişisel bilgiler sadece bu organizasyon kapsamında kullanılacak, hiçbir şekilde üçüncü şahıslarla paylaşılmayacaktır." },
  { title: "Mücbir Sebep ve Gecikmeler", description: "Tüm süreci titizlikle planlıyor ve uyguluyoruz. Ancak hava durumu, ulaşım engelleri veya diğer öngörülemeyen sebeplerden dolayı kurban kesimi veya hisse teslimatında gecikmeler yaşanabilir. Böyle bir durumda en kısa sürede bilgilendirme yapılacaktır." },
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
};
