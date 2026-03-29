/** Elya: Bizden Kareler + Hakkımızda (zikzak videolar) tek kaynak. */
const SAMPLE_WATCH_URL = "https://www.youtube.com/watch?v=dAGRwyGrNrM";

export interface ElyaGalleryVideoItem {
  title: string;
  youtubeUrl: string;
  /** Hakkımızda zikzak bölümünde videonun yanında gösterilecek kısa metin */
  sectionLead: string;
}

export const ELYA_GALLERY_VIDEOS: ElyaGalleryVideoItem[] = [
  {
    title: "KESİMHANE VE TESİS",
    youtubeUrl: SAMPLE_WATCH_URL,
    sectionLead:
      "Modern ve hijyenik kesimhanemizde süreçleri uçtan uca planlıyoruz. Kurban ibadetinin gerektirdiği dini hassasiyet ile çağın hizmet standartlarını bir araya getiriyoruz.",
  },
  {
    title: "HİZMET ANLAYIŞIMIZ",
    youtubeUrl: SAMPLE_WATCH_URL,
    sectionLead:
      "Güven, şeffaflık ve kaliteyi işimizin merkezine koyuyoruz. Her hissedarın huzurla ve gönül rahatlığıyla ibadetini tamamlaması için çalışıyoruz.",
  },
  {
    title: "KURBAN SÜRECİ",
    youtubeUrl: SAMPLE_WATCH_URL,
    sectionLead:
      "Seçimden teslimata kadar tüm adımları düzenli ve izlenebilir şekilde yürütüyoruz. Sürecin her aşamasında bilgilendirme ve net iletişim sunuyoruz.",
  },
  {
    title: "GÜVEN VE ŞEFFAFLIK",
    youtubeUrl: SAMPLE_WATCH_URL,
    sectionLead:
      "Hisse, ödeme ve teslimat konularında açık bilgi paylaşımı sağlıyoruz. Şeffaf bir organizasyonla güven oluşturmayı hedefliyoruz.",
  },
  {
    title: "EKİBİMİZ",
    youtubeUrl: SAMPLE_WATCH_URL,
    sectionLead:
      "Alanında uzman, disiplinli ve deneyimli ekibimizle hizmet kalitemizi sürekli geliştiriyoruz. Tesis ve saha operasyonlarında titiz bir çalışma yürütüyoruz.",
  },
  {
    title: "BİZDEN KARELER",
    youtubeUrl: SAMPLE_WATCH_URL,
    sectionLead:
      "Organizasyonumuza dair görüntüleri burada topluyoruz. Tüm videoları ayrıca “Bizden Kareler” sayfamızda da izleyebilirsiniz.",
  },
];
