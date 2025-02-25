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
    header: "Teslimat Seçeneği",
    description: "Dileyen hissedarların evine teslim (Ücret karşılığı)",
  },
];

export const priceInfo = [
  {
    kg: "23 kg ±3",
    price: "16.000",
  },
  {
    kg: "26 kg ±3",
    price: "18.000",
  },
  {
    kg: "30 kg ±3",
    price: "20.000",
  },
  {
    kg: "34 kg ±3",
    price: "22.000",
  },
  {
    kg: "38 kg ±3",
    price: "24.000",
  },
  {
    kg: "42 kg ±3",
    price: "26.000",
  },
  {
    kg: "46 kg ±3",
    price: "28.000",
  },
  {
    kg: "50 kg ±3",
    price: "30.000",
  },
];

export const processes = [
  {
    number: "01",
    header: "Hisse Seçim",
    description:
      "Hisse tablosunda size uygun hisseyi bulmak için filtreleri kullanın ve seçiminizi yapın",
  },
  {
    number: "02",
    header: "Hisse Onay",
    description:
      "Seçtiğiniz kurbanlık için hisse bilgilerini girdikten sonra telefonunuza gelen onay kodunu girerek seçiminizi kesinleştirin.",
  },
  {
    number: "03",
    header: "Hisse Sorgulama",
    description:
      "Onayınız akabinde hisse sorgulama ekranına gidip bilgilerinizi doğrulayın.",
  },
  {
    number: "04",
    header: "Ödeme",
    description:
      "Hisselerin kesinleşmesi için 7 gün içinde kaporanızı, 7 Haziran Cuma gününe kadar da tüm ödemelerinizi yapmalısınız.",
  },
  {
    number: "05",
    header: "Sıranızı Takip Edin",
    description:
      "Kurban bayramı 1. gününde sitemizin anasayfasında çıkacak olan bağlantıya tıklayarak sıranızı takip edebilirsiniz.",
  },
];

export const faq_items = [
  {
    id: "1",
    title: "Hisse nasıl satın alabilirim?",
    content: "Hisse almak için web sitemizin 'Hisse Al' bölümünden size uygun kurbanlığı seçebilir ve hisse kaydınızı gerçekleştirebilirsiniz. Seçiminizi yaptıktan sonra kişisel bilgilerinizi girerek işlemi tamamlayabilirsiniz."
  },
  {
    id: "2",
    title: "Kesim ve dağıtım süreci nasıl işliyor?",
    content: "Kurbanlar bayramın ilk günü İslami usullere uygun olarak, profesyonel kasaplar tarafından kesilmektedir. Kesim sonrası etler hijyenik ortamda işlenir ve tercih ettiğiniz teslimat şekline göre size ulaştırılır."
  },
  {
    id: "3",
    title: "Hisse kaydımı nasıl sorgulayabilirim?",
    content: "Hisse kaydınızı, telefonunuza gönderilen SMS'teki kod ile web sitemizin 'Hisse Sorgula' bölümünden kontrol edebilirsiniz. Burada hissenizle ilgili tüm detayları görebilir ve gerekli belgeleri indirebilirsiniz."
  },
  {
    id: "4",
    title: "Bir kurbanda kaç hisse bulunmaktadır?",
    content: "Her büyükbaş kurbanlık 7 hisseye bölünmektedir. Bu hisselerin her biri eşit değerdedir ve İslami kurallara uygun olarak paylaştırılmaktadır."
  },
  {
    id: "5",
    title: "Hisse seçimi yaptıktan sonra ne kadar süre içinde işlemi tamamlamalıyım?",
    content: "Hisse seçimi yaptıktan sonra 3 dakika içinde işlemi tamamlamanız gerekmektedir. Bu süre içinde işlem tamamlanmazsa seçiminiz iptal olur ve hisse başkaları tarafından alınabilir."
  },
  {
    id: "6",
    title: "Vekalet işlemi nasıl gerçekleşiyor?",
    content: "Vekalet işlemi, kurban kesimi öncesinde hissedarlarımızdan alınmaktadır. Bu işlem, kurbanınızın İslami usullere uygun olarak kesilmesi için gerekli dini prosedürün bir parçasıdır."
  },
  {
    id: "7",
    title: "Hisse bedelini taksitle ödeyebilir miyim?",
    content: "Evet, hisse bedelini taksitle ödeyebilirsiniz. İlk etapta minimum 2.000₺ kapora yatırmanız gerekmektedir. Kalan ödemeyi ise kesim gününe kadar tamamlamanız gerekmektedir."
  },
  {
    id: "8",
    title: "Kurbanımın kesim saatini nasıl öğrenebilirim?",
    content: "Kurbanınızın kesim saati, bayram sabahı SMS yoluyla size bildirilecektir. Ayrıca web sitemizin 'Hisse Sorgula' bölümünden de bu bilgiye ulaşabilirsiniz."
  },
  {
    id: "9",
    title: "Aynı kurbandan birden fazla hisse alabilir miyim?",
    content: "Evet, aynı kurbandan birden fazla hisse alabilirsiniz. Ancak bu durumda her hisse için ayrı kayıt oluşturulması gerekmektedir."
  },
  {
    id: "10",
    title: "Hisse kaydımda değişiklik yapabilir miyim?",
    content: "Evet, hisse kaydınızda kesim gününe kadar değişiklik yapabilirsiniz. Bunun için müşteri hizmetlerimizle iletişime geçmeniz yeterlidir."
  },
  {
    id: "11",
    title: "Kurban etleri nasıl dağıtılıyor?",
    content: "Kurban etleri, profesyonel kasaplar tarafından eşit olarak paylaştırılır. Tercih ettiğiniz teslimat şekline göre ya kesimhaneden teslim alabilir ya da belirlenen toplama noktalarından alabilirsiniz."
  },
  {
    id: "12",
    title: "Kurban derileri ne oluyor?",
    content: "Kurban derileri, İslami usullere uygun olarak hayır kurumlarına bağışlanmaktadır. Bu konuda tercih hakkı hissedarlara aittir."
  },
  {
    id: "13",
    title: "Kesim yerine gidip kurbanımı görebilir miyim?",
    content: "Evet, kesim yerine gelerek kurbanınızı görebilirsiniz. Ancak kesim alanına güvenlik nedeniyle sadece yetkili personel girebilmektedir."
  },
  {
    id: "14",
    title: "Hisse ücretimi iade alabilir miyim?",
    content: "Kesim öncesinde yazılı başvuru yapmanız halinde hisse ücretinizi iade alabilirsiniz. Kesim sonrası iade işlemi yapılamamaktadır."
  },
  {
    id: "15",
    title: "Kurbanlıklar nasıl seçiliyor?",
    content: "Kurbanlıklarımız, dini vecibelere uygunluk ve sağlık durumu göz önünde bulundurularak uzman ekibimiz tarafından titizlikle seçilmektedir."
  },
  {
    id: "16",
    title: "Kurbanlıkların sağlık kontrolleri yapılıyor mu?",
    content: "Evet, tüm kurbanlıklarımız veteriner kontrolünden geçmektedir ve gerekli sağlık belgeleri bulunmaktadır."
  },
  {
    id: "17",
    title: "Hisse bedelleri neye göre belirleniyor?",
    content: "Hisse bedelleri, kurbanlığın ağırlığı ve piyasa koşulları göz önünde bulundurularak belirlenmektedir. Her kurbanlık için hisse bedeli farklılık gösterebilir."
  },
  {
    id: "18",
    title: "Toplama noktalarında et dağıtım saatleri nedir?",
    content: "Toplama noktalarındaki et dağıtım saatleri bayramın ilk günü 14:00-20:00 saatleri arasındadır. Size özel belirlenen saatte gelmeniz önemlidir."
  },
  {
    id: "19",
    title: "İletişim bilgilerimi nasıl güncelleyebilirim?",
    content: "İletişim bilgilerinizi güncellemek için müşteri hizmetlerimizle iletişime geçebilirsiniz. Özellikle telefon numarası değişikliklerini mutlaka bildirmeniz önemlidir."
  },
  {
    id: "20",
    title: "Kesim ve dağıtım işlemi ne kadar sürüyor?",
    content: "Kesim ve dağıtım işlemleri bayramın ilk günü sabah namazından sonra başlar ve aynı gün içinde tamamlanır. Her hissedarımıza tahmini bir teslimat saati verilmektedir."
  }
];

export const contact_infos = [
  {
    icon: "location.svg",
    header: "İMH Ankara Merkez",
    info: "Hacıbayram Mah. Adliye Sok. No:1 Ulus/Ankara",
  },
  {
    icon: "mail.svg",
    header: "E-maillerinize 24 saat içerisinde dönüş sağlıyoruz.",
    info: "imhankara06@hotmail.com",
  },
  {
    icon: "phone.svg",
    header: "Bizi arayın.",
    info: "0312 312 44 64 - 0552 652 90 00",
  },
];