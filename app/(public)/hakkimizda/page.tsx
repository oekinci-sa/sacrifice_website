"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import AnimatedCounter from "./components/AnimatedCounter";

const item = {
  hidden: { opacity: 0, y: 50 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const ELYA_ABOUT_CONTENT = [
  "Kurban hizmetleri alanında güven, şeffaflık ve kaliteyi esas alan bir anlayışla faaliyet gösteriyoruz. Amacımız; kurban ibadetini, hem dini hassasiyetlere uygun hem de modern hizmet standartlarıyla buluşturarak en doğru şekilde yerine getirilmesini sağlamaktır.",
  "Uzun yıllardır sektörde edinilmiş tecrübe ile güçlü altyapıyı bir araya getirerek, sürecin her aşamasını planlı, düzenli ve güvenilir bir şekilde yürütüyoruz. Bölgesinde örnek gösterilen modern tesisimiz ve disiplinli çalışma sistemimizle, hizmet kalitemizi her geçen gün daha ileriye taşıyoruz.",
  "Geçtiğimiz yıllarda elde ettiğimiz tecrübe ve müşteri memnuniyetinin verdiği güçle, her geçen yıl hizmet kapasitemizi artırıyor; bu yıl itibarıyla organizasyonumuzu büyüterek kapasitemizi iki katına çıkarıyoruz.",
  "Amacımız; kurban ibadetinin güven içinde, huzurla ve usulüne uygun şekilde yerine getirilmesine vesile olmaktır.",
  "Modern tesisimiz, tecrübeli ekibimiz ve dürüst hizmet anlayışımızla her yıl daha fazla aileye güvenilir kurban hizmeti sunmayı hedefliyoruz.",
];

const AboutPage = () => {
  const { logo_slug } = useTenantBranding();
  const isElya = logo_slug === "elya-hayvancilik";

  return (
    <div className="container">

      {/* Page Header */}
      <h1 className="text-3xl md:text-4xl font-bold my-4 md:my-8 text-center md:text-left">
        Hakkımızda
      </h1>

      {/* About Us Content */}
      <div className="flex flex-col md:flex-row gap-8 md:gap-32 text-black/80">
        <div className="w-full md:w-2/3 flex flex-col gap-4 md:gap-6 text-base md:text-xl">
          {isElya ? (
            ELYA_ABOUT_CONTENT.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))
          ) : (
            <>
              <p>
                2019 yılından bu yana, kurban organizasyonumuz ile binlerce
                hissedarımıza güvenilir ve şeffaf bir hizmet sunmaktayız.
                Amacımız, kurban ibadetinin İslami usullere uygun şekilde
                gerçekleştirilmesini sağlamak ve bu süreçte hissedarlarımıza en
                iyi deneyimi yaşatmaktır.
              </p>
              <p>
                Organizasyonumuz, alanında uzman kasaplar ve veterinerler
                eşliğinde, modern kesimhane ortamında gerçekleştirilmektedir.
                Kurbanlıklarımız, dini vecibelere uygunluk açısından titizlikle
                seçilmekte ve sağlık kontrolleri düzenli olarak yapılmaktadır.
              </p>

              <AnimatedCounter />

              <p>
                Her yıl büyüyen ailemizle birlikte, kurban organizasyonumuzu daha da
                geliştiriyor ve hizmet kalitemizi artırıyoruz. Hissedarlarımızın
                güveni ve memnuniyeti, bizim için en büyük motivasyon kaynağıdır.
              </p>
            </>
          )}
        </div>

        {/* Image */}
        <div className="w-full md:w-1/2 md:mt-0">
          <motion.div
            variants={item}
            className="w-full aspect-square relative"
          >
            <Image
              src="/images/main-image.jpg"
              alt="Main Page Image"
              fill
              priority
              className="object-cover rounded-lg"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
