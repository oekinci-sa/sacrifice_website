/**
 * Elya Hayvancılık — Hisse Al onay adımı mesafeli satış sözleşmesi (statik metin).
 * Ankara Kurban ve diğer tenant’lar `tenant_settings` sözleşme alanlarını kullanmaya devam eder.
 */
export function ElyaHisseAgreementTermsBody() {
  return (
    <div className="flex flex-col gap-3 md:gap-4 text-sm md:text-base text-muted-foreground">
      <h3 className="text-base md:text-lg font-semibold text-primary text-center leading-snug">
        <span className="block">KURBAN KESİM ORGANİZASYONU VE</span>
        <span className="block mt-1">MESAFELİ SATIŞ SÖZLEŞMESİ</span>
      </h3>

      <h4 className="text-sm md:text-base font-semibold text-foreground">
        Giriş ve Taraflar
      </h4>
      <p className="leading-relaxed">
        İşbu sözleşme, Elya Hayvancılık A.Ş. (Yüklenici) ile kurban hisse kaydı oluşturan
        Hissedar arasında; kurbanlık hayvan tedariki, bakımı, kesimi ve hisse teslimatı
        hizmetlerine ilişkin şartları belirlemek amacıyla ticari bir esasla hazırlanmıştır.
      </p>
      <p className="leading-relaxed">
        Amacımız, ibadet niyetiyle yapılan bu hizmetin profesyonel, şeffaf ve güvenilir
        şekilde gerçekleşmesidir.
      </p>
      <p className="leading-relaxed">
        Sisteme kayıt olduğunuzda, aşağıdaki maddeleri okumuş ve hukuken kabul etmiş
        sayılacaksınız.
      </p>

      <section className="space-y-2">
        <h4 className="text-sm md:text-base font-semibold text-foreground">
          1. Ödeme, Kapora ve Rezervasyon Şartları
        </h4>
        <p className="leading-relaxed">
          <span className="font-medium text-foreground">Hisse Kesinleşmesi: </span>
          Kurban hisse kaydınızın kesinleşmesi için başvuruyu takip eden 10 gün içerisinde her
          bir hisse için en az 10.000 TL kapora ödenmesi beklenmektedir.
        </p>
        <p className="leading-relaxed">
          <span className="font-medium text-foreground">Bakiye Ödemesi: </span>
          Toplam bakiye ödemelerinin, organizasyon planlamalarının aksamaması adına 20 Mayıs
          tarihine kadar tamamlanması esastır.
        </p>
        <p className="leading-relaxed">
          <span className="font-medium text-foreground">Ödeme Kolaylığı ve İletişim: </span>
          Belirtilen kapora tutarı ve ödeme tarihleri konusunda özel bir durumunuz veya bütçe
          planlamanız varsa, lütfen satış temsilcimizle iletişime geçiniz.
        </p>
        <p className="leading-relaxed">
          Amacımız, ibadetinize vesile olmak için karşılıklı rıza ile size en uygun ödeme
          takvimini oluşturmaktır.
        </p>
        <p className="leading-relaxed">
          Bu durumda bakiye ödemesinin kesim günü elden yapılması veya sürenin uzatılması gibi
          kolaylıklar Elya Hayvancılık A.Ş. inisiyatifindedir.
        </p>
        <p className="leading-relaxed">
          <span className="font-medium text-foreground">Kontenjan Yönetimi: </span>
          Herhangi bir bilgilendirme yapılmaksızın ödeme süresi geçen ön başvurularda, kayıt
          durumu organizasyonun sıhhati açısından yeniden değerlendirilebilir. (İlk defa kayıt
          olan hissedarlarımız için hisse numarası tahsisi, kapora ödemesi sonrası
          kesinleşmektedir.)
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm md:text-base font-semibold text-foreground">
          2. Vekâlet ve Kesim Usulleri
        </h4>
        <p className="leading-relaxed">
          <span className="font-medium text-foreground">Dini Kurallar: </span>
          Kesim işlemleri; İslami usullere, hijyen standartlarına uygun olarak ve ehil
          kasaplarca gerçekleştirilir. Hissedar, bu sözleşmeyi onaylayarak kurbanının
          kesilmesi için gerekli vekâleti vermiş sayılır.
        </p>
        <p className="leading-relaxed">
          <span className="font-medium text-foreground">Randevu ve Zamanlama: </span>
          Hissedarların, kendilerine bildirilen randevu saatinden en az 45 dakika önce çiftlikte
          hazır bulunmaları gerekmektedir.
        </p>
        <p className="leading-relaxed">
          <span className="font-medium text-foreground">Gıyabi Kesim: </span>
          Randevu saatinde anons edildiği halde kesim alanında hazır bulunmayan hissedarların
          kurbanları, organizasyonun aksamaması adına alınan vekâlete istinaden belirlenen
          saatte kesilir. Kesilen kurban, hissedar adına muhafaza edilir ve geldiğinde kendisine
          teslim edilir.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm md:text-base font-semibold text-foreground">
          3. İptal ve İade Koşulları
        </h4>
        <p className="leading-relaxed">
          Kurban bayramına 30 gün kalana kadar yapılan yazılı iptal taleplerinde, ödenen tutarın
          tamamı iade edilir.
        </p>
        <p className="leading-relaxed">
          Bayrama 30 günden az süre kalan iptallerde; hayvan tedariki, bakım masrafları ve
          organizasyon planlamaları tamamlandığı için kapora iadesi yapılamamaktadır. Ancak
          hissedar, kendi yerine başka birini bulma/devretme hakkına sahiptir.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm md:text-base font-semibold text-foreground">
          4. Hizmet Kusuru ve Mücbir Sebepler
        </h4>
        <p className="leading-relaxed">
          Tüm süreç titizlikle yönetilmektedir. Ancak hava muhalefeti, lojistik aksamalar veya
          beklenmedik teknik arızalar nedeniyle kesim saatlerinde kaymalar yaşanabilir. Bu tür
          durumlarda hissedarlar anlık olarak bilgilendirilir.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm md:text-base font-semibold text-foreground">
          5. Hisse Gramaj Esasları ve Hakkaniyet Uygulaması
        </h4>
        <p className="leading-relaxed">
          <span className="font-medium text-foreground">Hisse Bilgilendirmesi: </span>
          Kurbanlık hayvanların doğası gereği, kesim sonrası elde edilecek net et miktarı
          (karkas randımanı) kesin olarak öngörülememektedir. Bu nedenle organizasyonumuzda
          belirtilen kg aralıkları, geçmiş yılların ortalamalarına dayanan bir bilgilendirme
          amaçlı olup kesin bir taahhüt niteliği taşımamaktadır. Bu konuda ayrıntılı bilgi için
          müşteri temsilcimizle görüşebilirsiniz.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm md:text-base font-semibold text-foreground">
          6. Bilgilendirme ve Takip
        </h4>
        <p className="leading-relaxed">
          Hissedarlar, güncel durumlarını ve hisse detaylarını web sitemizdeki &quot;Hisse
          Sorgula&quot; ekranından telefon numaralarıyla takip edebilirler.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm md:text-base font-semibold text-foreground">
          7. Kişisel Verilerin Korunması (KVKK)
        </h4>
        <p className="leading-relaxed">
          Paylaştığınız kimlik ve iletişim bilgileri sadece kurban organizasyonu, vekâlet
          işlemleri ve bilgilendirme süreçleri kapsamında kullanılacak; üçüncü şahıslarla
          paylaşılmayacaktır.
        </p>
      </section>

      <p className="leading-relaxed pt-1">
        Siz değerli hissedarlarımızın bu anlayışla sürece katkı sağlaması bizler için
        kıymetlidir.
      </p>
      <p className="leading-relaxed">
        Allah&apos;tan kurbanınızı kabul etmesini niyaz ederiz.
      </p>
    </div>
  );
}
