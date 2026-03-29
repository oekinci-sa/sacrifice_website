/**
 * Elya Hayvancılık anasayfa SSS — mevcut kategorilere eklenir; diğer tenant’larda kullanılmaz.
 */
export interface ElyaFaqExtraItem {
  id: string;
  title: string;
  content: string;
}

/** Kategori `id` (constants `faq_categories`) → ek sorular */
export const ELYA_FAQ_EXTRA_BY_CATEGORY: Record<string, ElyaFaqExtraItem[]> = {
  "kesim-dagitim-sureci": [
    {
      id: "elya-kesim-1",
      title: "Çiftliğiniz nerede ve kesim günü süreç nasıl işliyor?",
      content:
        "Çiftliğimiz Ankara-Gölbaşı-Çimşit köyüne bağlı ve Konya Yoluna sıfır bir konumdadır. Kesim günü randevu saatinizden 45 dakika önce gelmeniz yeterlidir. Sizi kahvaltı, öğle yemeği ve çocuklar için pamuk şeker ikramlarımızın olduğu festival tadında bir ortam bekliyor.",
    },
    {
      id: "elya-kesim-2",
      title: "Hisselerin kemik ve yağ dağılımı nasıl yapılıyor?",
      content:
        "Hisselerimiz kemikli et esasına göredir ve kemik oranı ortalama %15-20’dir. En hassas olduğumuz konu \"kul hakkı\"dır; bu sebeple hayvanın yağı, antrikotu, kuşbaşısı ve kemikli kısımları 7 hisseye de profesyonel terazilerle eşit ve homojen şekilde dağıtılır.",
    },
  ],
  "kurbanlik-bilgileri": [
    {
      id: "elya-kurban-1",
      title: "Kesim sırasında orada bulunmam şart mı?",
      content:
        "Sünnet olan kurbanın başında bulunmaktır ancak gelemezseniz vekâletiniz doğrultusunda kesiminiz yapılır ve hisseniz sizin adınıza hijyenik koşullarda muhafaza edilir.",
    },
    {
      id: "elya-kurban-2",
      title: "Bir hisse ortalama kaç kg geliyor?",
      content:
        "Hisselerimiz satın aldığınız grup aralıklarında belirtildiği gibi değişkendir. Bu bir et satışı değil ibadet olduğu için rakamlar değişkenlik gösterebilir. Bu konuda daha fazla bilgi almak için müşteri temsilcimizle görüşebilirsiniz.",
    },
    {
      id: "elya-kurban-3",
      title: "Hisseli kurbanda aldığım hayvanı ne zaman görebilirim?",
      content:
        "Kurbanlıklarımızı bayrama son 1 hafta kala görebilirsiniz. Size taahhüt ettiğimiz et miktarını yakalamak ve hayvanın bayram sabahına kadar sağlık (sakatlanma, hastalık) veya fıkhi (kapak atma) şartlarını koruduğundan emin olmak için bu süreci titizlikle yönetiyoruz. Bir aksilik durumunda ibadetinizin aksamaması için hayvanı muadiliyle değiştirme hakkımızı saklı tutuyoruz.",
    },
    {
      id: "elya-kurban-4",
      title:
        "Canlı baskül (kg fiyatı) üzerinden aldığım kurbanım ne zaman tartılıyor?",
      content:
        "En doğru ve güncel kiloyu belirlemek adına tartım işlemleri bayrama 7 ila 3 gün kala yapılır ve güncel tutar tarafınıza hemen bildirilir.",
    },
  ],
  odeme: [
    {
      id: "elya-odeme-1",
      title: "Kapora ödemesinde esneklik sağlıyor musunuz?",
      content:
        "Kayıt kesinleşmesi için 10.000 TL kapora esastır. Ancak özel bir bütçe planlamanız varsa lütfen bizimle iletişime geçin; amacımız ibadetinize vesile olmak, karşılıklı rıza ile size en uygun takvimi oluşturabiliriz.",
    },
  ],
};

/** Mevcut SSS kategorilerine Elya eklerini sona ekler. */
export function mergeElyaFaqExtrasIntoCategories<
  T extends {
    id: string;
    title: string;
    items: Array<{ id: string; title: string; content: string }>;
  },
>(base: T[], includeElyaExtras: boolean): T[] {
  if (!includeElyaExtras) return base;
  return base.map((cat) => ({
    ...cat,
    items: [
      ...cat.items,
      ...(ELYA_FAQ_EXTRA_BY_CATEGORY[cat.id] ?? []),
    ],
  }));
}
