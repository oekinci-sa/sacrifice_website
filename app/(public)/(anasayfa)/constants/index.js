export const navigationItems = [
  {
    title: "Anasayfa",
    href: "/",
    description: "",
  },
  {
    title: "Hakkımızda",
    href: "/hakkimizda",
    description: "",
  },
  {
    title: "Hisse İşlemleri",
    items: [
      {
        title: "Hisse Al",
        href: "/hisseal",
      },
      {
        title: "Hisse Sorgula",
        href: "/hissesorgula",
      },
    ],
  },
  {
    title: "Yazılar",
    href: "/yazilar",
    description: "",
  },

  {
    title: "İletişim",
    href: "/iletisim",
    description: "",
  },
];

export const mediaLinks = [
  {
    href: "https://www.facebook.com/imhankara06",
    iconName: "bi bi-facebook",
    color: "text-blue-600",
  },
  {
    href: "https://twitter.com/imhankara",
    iconName: "bi bi-twitter-x",
    color: "text-black",
  },
  {
    href: "https://www.instagram.com/imhankara06/",
    iconName: "bi bi-instagram",
    color: "text-pink-600",
  },
  {
    href: "https://www.youtube.com/@insanvemedeniyethareketiankara",
    iconName: "bi bi-youtube",
    color: "text-red-600",
  },
  {
    href: "http://www.imhankara.org.tr/",
    iconName: "bi bi-globe",
    color: "text-sky-500",
  },
];

export const features = [
  {
    src: "calendar.svg",
    header: "Vaktinde Teslim",
    description: "Bayramın ilk günü teslim",
  },
  {
    src: "cleanness.svg",
    header: "İçiniz Rahat Olsun",
    description: "İslami usullere uygun ve hijyenik",
  },
  {
    src: "camera.svg",
    header: "Video Kayıt Sistemi",
    description: "Dileyen hissedarlara kesim kaydı gönderimi",
  },
  {
    src: "truck.svg",
    header: "Teslimat Seçeneğimiz",
    description: "Kesimhaneden ya da Ulus'tan teslim (Ücret karşılığı)",
  },
];

export const priceInfo = [
  {
    kg: "23 kg",
    price: "20.000",
  },
  {
    kg: "26 kg",
    price: "22.000",
  },
  {
    kg: "30 kg",
    price: "24.000",
  },
  {
    kg: "34 kg",
    price: "26.000",
  },
  {
    kg: "38 kg",
    price: "28.000",
  },
  {
    kg: "42 kg",
    price: "30.000",
  },
  {
    kg: "46 kg",
    price: "32.000",
  },
  {
    kg: "50 kg",
    price: "34.000",
  }
];

export const processes = [
  {
    number: "01",
    header: "Hisse Seçim",
    description:
      "Hisse tablosunda size uygun hisseyi kolay bir şekilde bulmak için filtreleri kullanın ve seçiminizi yapın.",
  },
  {
    number: "02",
    header: "Hissedar Bilgileri",
    description:
      "Hissedar bilgilerini girdikten sonra, hisse sorgulama için kendi belirleyeceğiniz bir güvenlik kodu oluşturun."
  },
  {
    number: "03",
    header: "Hisse Sorgulama",
    description:
      "Kaydınızın kesinleştiğinden emin olmak için, hissedar sorgulama ekranına gidip bilgilerinizi doğrulayın.",
  },
  {
    number: "04",
    header: "Güvende Hissedin",
    description:
      "Hisse kaydınızı yaptıktan sonra kayıt belgenizi sistemden indirip güvenle saklayabilirsiniz."
  },
  {
    number: "05",
    header: "Ödeme",
    description:
      "Kaydınızın kalıcı olması için 3 gün içinde kaporanızı, 30 Mayıs Cuma gününe kadar da tüm ödemelerinizi tamamlamalısınız.",
  },
  {
    number: "06",
    header: "Sıranızı Takip Edin",
    description:
      "Kurban Bayramı’nın 1. gününde sitemizin anasayfasında yer alacak sıra takip ekranından sıranızı canlı olarak görebilirsiniz.",
  },
];

export const faq_categories = [
  {
    id: "hisse-satin-alma",
    title: "Hisse Alımı",
    items: [
      {
        id: "1",
        title: "Hisse nasıl satın alabilirim?",
        content:
          "Hisse almak için web sitemizin \"Hisse Al\" bölümünden size uygun kurbanlığı seçebilir ve bilgilerinizi girerek hisse kaydınızı gerçekleştirebilirsiniz.",
      },
      {
        id: "28",
        title:
          "Hisse seçimi yapıldıktan sonra, hissedar bilgilerini doldururken başkaları aynı hisseyi alabilir mi?",
        content:
          "Hayır, hisse seçiminizi yaptıktan sonra, sistem bu hisseleri sizin için ayırır. Bilgilerinizi doldurduğunuz süre boyunca başka kimse aynı hisseler üzerinde işlem yapamaz.",
      },
      {
        id: "5",
        title:
          "Hisse seçimi yaptıktan sonra ne kadar süre içinde işlemi tamamlamalıyım?",
        content:
          "3 dakika boyunca hiçbir işlem yapılmazsa, işleminiz zaman aşımına uğrar ve otomatik olarak yeniden hisse seçim ekranına döndürülürsünüz. Ayrıca 15 dakika içinde işleminizi tamamlamazsanız, süre dolduğu için sistem sizi otomatik olarak başa döndürür ve işleminiz iptal edilir.",
      },
      {
        id: "9",
        title: "Aynı kurbandan birden fazla hisse alabilir miyim?",
        content:
          "Evet, aynı kurbandan birden fazla hisse alabilirsiniz. Ancak bu durumda da her hisse için ayrı kayıtlar oluşturulması gerekmektedir.",
      },
      {
        id: "3",
        title: "Hisse kaydımı nasıl sorgulayabilirim?",
        content:
          "Hisse kaydınızı, hisse seçimi yaptıktan sonra oluşturulan telefon numaranız ve belirleyeceğiniz güvenlik kodunuz ile \"Hisse Sorgula\" bölümünden kontrol edebilirsiniz. Burada hissenizle ilgili tüm detayları görebilirsiniz.",
      },
      {
        id: "19",
        title: "İletişim bilgilerimi nasıl güncelleyebilirim?",
        content:
          "İletişim bilgilerinizi güncellemek için bizimle iletişime geçebilirsiniz. Özellikle telefon numaranızdaki değişiklikleri bildirmeniz, sizlerle sağlıklı iletişim kurabilmemiz için önemlidir.",
      },
    ],
  },
  {
    id: "odeme",
    title: "Ödeme",
    items: [
      {
        id: "7",
        title: "Kapora ücreti var mı, hisse bedelini taksitle ödeyebilir miyim?",
        content:
          "İlk etapta minimum 5.000 TL kapora yatırmanız gerekmektedir. Kalan ödemeyi ise 30 Mayıs Cuma gününe kadar tamamlamanız gerekmektedir.",
      },
      {
        id: "14",
        title: "Hisse ücretimi iade alabilir miyim?",
        content:
          "Kurban Bayramı'ndan en az bir hafta (7 gün) önce yazılı başvuru yapmanız halinde hisse ücretinizi iade alabilirsiniz. Bu süreyi geçirenlerin talepleri kabul edilmeyecektir.",
      },
    ],
  },
  {
    id: "kurbanlik-bilgileri",
    title: "Kurbanlık Bilgileri",
    items: [
      {
        id: "17",
        title: "Hisse bedelleri neye göre belirleniyor?",
        content:
          "Hisse bedelleri, kurbanlığın ağırlığı ve piyasa koşulları göz önünde bulundurularak belirlenmektedir.",
      },
      {
        id: "15",
        title: "Kurbanlıklar nasıl seçiliyor?",
        content:
          "Kurbanlıklarımız, dini vecibelere uygunluk ve sağlık durumu göz önünde bulundurularak titizlikle seçilmektedir.",
      },
      {
        id: "13",
        title: "Kesim yerine gidip kurbanımı görebilir miyim?",
        content:
          "Evet, 30 Mayıs Cuma gününden itibaren bizlerle iletişime geçtikten sonra kurbanınızı görebilirsiniz.",
      },
      {
        id: "8",
        title: "Kurbanımın kesim saatini nasıl öğrenebilirim?",
        content:
          "Kurbanınızın kesim saati bilgisine web sitemizin \"Hisse Sorgula\" bölümünden ulaşabilirsiniz.",
      },
      {
        id: "6",
        title: "Vekalet işlemi nasıl gerçekleşiyor?",
        content:
          "Vekaletler, kurban kesimi öncesinde hissedarlarımızdan telefon görüşmesi ile alınmaktadır.",
      },
      {
        id: "12",
        title: "Kurban derileri nasıl değerlendiriliyor?",
        content:
          "Kurban derileri, vakfımızca eğitim, insani yardım vb. faaliyetler için değerlendirilmektedir. Hissedarların ortak kararı ile deriler istenilen başka bir hayır kurumuna da bağış yapılabilmektedir.",
      },
    ],
  },
  {
    id: "kesim-dagitim-sureci",
    title: "Kesim ve Dağıtım Süreci",
    items: [
      {
        id: "2",
        title: "Kesim ve dağıtım süreci nasıl işliyor?",
        content:
          "Kurbanlar, bayramın ilk günü İslami usullere uygun olarak, çiftlik kasapları tarafından kesilmektedir. Kesim sonrası etler hijyenik ortamda işlenir ve tercih ettiğiniz teslimat şekline göre size ulaştırılır.",
      },
      {
        id: "20",
        title: "Kesim ve dağıtım işlemi ne kadar sürüyor?",
        content:
          "Kesim ve dağıtım işlemleri bayramın ilk günü sabah namazından sonra başlar ve aynı gün içinde tamamlanır. Her hissedarımıza tahmini bir kesim ve teslimat saati verilmektedir.",
      },
      {
        id: "11",
        title: "Kurban etleri nasıl paylaştırılıyor?",
        content:
          "Her kurbanın eti, profesyonel kasaplarımız tarafından kıymetli parçalarına özen gösterilerek hisselere eşit olarak paylaştırılır. Tercihinize göre dilerseniz kesimhaneden, dilerseniz belirlenen toplama noktalarından teslim alabilirsiniz.",
      },
      {
        id: "18",
        title: "Toplama noktalarında hisselerin dağıtım saatleri nedir?",
        content:
          "Teslim noktalarındaki et dağıtımı bayramın ilk günü size bildirilen saatte yapılmaktadır. Size özel belirlenen saatte teslim noktasına gelmeniz önemlidir.",
      },
    ],
  },
];

// Eski faq_items listesini de tutalım (geriye dönük uyumluluk için)
export const faq_items = faq_categories.flatMap(category => category.items);

export const contact_infos = [
  {
    icon: "location.svg",
    header: "İMH Ankara Merkez",
    info: "Hacıbayram Mah. Adliye Sok. No:1 Ulus/Ankara",
  },
  {
    icon: "mail.svg",
    header: "E-maillerinize 24 saat içerisinde dönüş sağlıyoruz.",
    info: "iletisim@ankarakurban.com.tr",
  },
  {
    icon: "phone.svg",
    header: "Bizi arayın.",
    info: "0312 312 44 64 - 0552 652 90 00",
  },
];