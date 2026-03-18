"use client";

import type { TenantBranding } from "@/lib/tenant-branding";
import { createContext, useContext, useEffect, useState } from "react";

interface TenantBrandingContextValue {
  branding: TenantBranding;
  setBranding: (b: TenantBranding) => void;
}

const TenantBrandingContext = createContext<TenantBrandingContextValue | null>(null);

const DEFAULT_AGREEMENT_TERMS: { title: string; description: string }[] = [
  { title: "Ödeme ve Kapora", description: "Her hisse için hisse alımdan itibaren 3 gün içerisinde en az 5000₺ kapora ödenmesi zorunludur. Kalan tutarın ise 20 Mayıs Çarşamba gününe kadar eksiksiz olarak tamamlanması beklenmektedir. Belirtilen tarihlere kadar ödeme tamamlanmazsa hisse hakkı iptal edilebilir." },
  { title: "Vekalet ve Dini Usuller", description: "Hissedar, bu organizasyona katılarak kurban ibadetinin vekâleten gerçekleştirilmesini kabul etmiş sayılır. Kurban kesimi, İslami usullere ve hijyenik koşullara uygun olarak ehil kişilerce gerçekleştirilecektir." },
  { title: "İptal ve İade Koşulları", description: "Kurban kesim tarihinden en az 1 ay önce yazılı olarak talepte bulunmanız halinde, hisse bedelinizin iadesi mümkündür. Kesim gününe 1 aydan daha kısa bir süre kaldıysa iade yapılamaz." },
  { title: "Adres ve Bilgi Güncellemeleri", description: "Teslimat adresi veya iletişim bilgilerinizde bir değişiklik olduysa, bu bilgileri kesim gününden önce bizimle paylaşmanız gerekmektedir. Aksi halde hissenizin size zamanında ve doğru şekilde ulaşması garanti edilemez." },
  { title: "Bilgilendirme ve Takip", description: "Hisse kaydınızı, telefon numaranız ve güvenlik kodunuz ile \"Hisse Sorgula\" sayfası üzerinden görüntüleyebilirsiniz. Bayram günü ise web sitemizin ana sayfasında yayınlanacak \"Kurbanlık Takip Ekranı\" aracılığıyla, kesim, paylaştırma ve teslimat işlemleri sırasında hangi kurbanlık üzerinde işlem yapıldığını anlık olarak takip edebilirsiniz." },
  { title: "Gizlilik ve Veri Güvenliği", description: "Paylaştığınız kişisel bilgiler sadece bu organizasyon kapsamında kullanılacak, hiçbir şekilde üçüncü şahıslarla paylaşılmayacaktır." },
  { title: "Mücbir Sebep ve Gecikmeler", description: "Tüm süreci titizlikle planlıyor ve uyguluyoruz. Ancak hava durumu, ulaşım engelleri veya diğer öngörülemeyen sebeplerden dolayı kurban kesimi veya hisse teslimatında gecikmeler yaşanabilir. Böyle bir durumda en kısa sürede bilgilendirme yapılacaktır." },
];

const DEFAULT_BRANDING: TenantBranding = {
  logo_slug: "ankara-kurban",
  iban: "Kapora için IBAN bilgisi daha sonra sizlerle paylaşılacaktır.",
  website_url: "ankarakurban.com.tr",
  contact_phone: "0312 312 44 64 / 0552 652 90 00",
  contact_email: "iletisim@ankarakurban.com.tr",
  contact_address: "Hacı Bayram, Ulus, Adliye Sk. No:1 Altındağ/Ankara (09.00 - 18.00)",
  deposit_amount: 10000,
  deposit_deadline_days: 3,
  full_payment_deadline_month: 5,
  full_payment_deadline_day: 20,
  agreement_terms: DEFAULT_AGREEMENT_TERMS,
};

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
