"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import AnimatedCounter from "./components/AnimatedCounter";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

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

const AboutPage = () => {
  return (
    <div className="container mx-auto px-4 md:py-12">
      <h1 className="text-xl md:text-4xl font-bold mb-8 text-center md:text-left">
        Hakkımızda
      </h1>
      <div className="flex flex-col md:flex-row gap-8 md:gap-32">

        <div className="w-full md:w-2/3">
          <div className="flex flex-col gap-4">
            <p className="text-base md:text-xl">
              2019 yılından bu yana, kurban organizasyonumuz ile binlerce
              hissedarımıza güvenilir ve şeffaf bir hizmet sunmaktayız.
              Amacımız, kurban ibadetinin İslami usullere uygun şekilde
              gerçekleştirilmesini sağlamak ve bu süreçte hissedarlarımıza en
              iyi deneyimi yaşatmaktır.
            </p>
            <p className="text-base md:text-xl">
              Organizasyonumuz, alanında uzman kasaplar ve veterinerler
              eşliğinde, modern kesimhane ortamında gerçekleştirilmektedir.
              Kurbanlıklarımız, dini vecibelere uygunluk açısından titizlikle
              seçilmekte ve sağlık kontrolleri düzenli olarak yapılmaktadır.
            </p>
          </div>

          <AnimatedCounter />

          <p className="text-base md:text-xl">
            Her yıl büyüyen ailemizle birlikte, kurban organizasyonumuzu daha da
            geliştiriyor ve hizmet kalitemizi artırıyoruz. Hissedarlarımızın
            güveni ve memnuniyeti, bizim için en büyük motivasyon kaynağıdır.
          </p>
        </div>

        {/* Image for both mobile and desktop */}
        <div className="w-full md:w-1/2 mt-8 md:mt-0">
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
            <div className="absolute -left-8 -top-8 z-10 hidden md:block">
              <Image
                src="/icons/three-lines.svg"
                alt="Decorative Lines"
                width={120}
                height={120}
                className="opacity-80"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
