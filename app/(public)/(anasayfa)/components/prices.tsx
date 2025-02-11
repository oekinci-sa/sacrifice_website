import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { motion } from "framer-motion";

const Prices = () => {
  const router = useRouter();
  const priceItems = Array.from({ length: 9 }, (_, i) => ({
    kg: 26 + (i * 4),
    price: 30000 + (i * 6000)
  }));

  const sectionVariant = {
    hidden: { opacity: 0, y: 50 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const pricesGridVariant = {
    hidden: { opacity: 0 },
    show: { 
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="container flex flex-col lg:flex-row lg:space-x-16 space-y-8 lg:space-y-0">
      {/* Sol kısım */}
      <motion.div 
        className="flex items-start space-x-4 w-full lg:w-auto"
        variants={sectionVariant}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        {/* Left Image */}
        <div className="relative w-1/2 sm:w-80 aspect-[4/5] md:aspect-[3/4]">
          <Image
            src="/images/left-image.jpg"
            alt="Left Side Image"
            fill
            priority
            className="object-cover rounded-lg"
          />
          <Image
            src="/icons/birds.svg"
            alt="Birds Icon"
            width={96}
            height={96}
            priority
            className="absolute right-4 lg:scale-150 -bottom-12 lg:right-12 lg:-bottom-18"
          />
        </div>

        {/* Right Image and Two Rectangulars */}
        <div className="flex flex-col w-1/2 items-center space-y-4">
          {/* İkili */}
          <div className="flex sm:flex-row justify-between sm:gap-4 w-full">
            {/* 7 Yıl+ */}
            <div className="flex flex-col items-center justify-center bg-black text-white rounded-md p-2 w-full sm:w-36 h-20 sm:h-36">
              <p className="text-base sm:text-4xl font-bold">
                7 Yıl<span className="text-sac-primary">+</span>
              </p>
              <p className="text-base sm:text-3xl">Tecrübe</p>
            </div>
            {/* 1000+ */}
            <div className="flex flex-col items-center justify-center bg-sac-primary text-white rounded-md p-2 w-full sm:w-36 h-20 sm:h-36">
              <p className="text-base sm:text-4xl font-bold">
                1000<span>+</span>
              </p>
              <p className="text-base sm:text-3xl">Kurban</p>
            </div>
          </div>
          <div className="relative w-full sm:w-80 aspect-[4/5] md:aspect-[3/4]">
            <Image
              src="/images/right-image.jpg"
              alt="Right Side Image"
              fill
              priority
              className="object-cover rounded-lg"
            />
          </div>
        </div>
      </motion.div>

      {/* Sağ kısım */}
      <motion.div 
        className="flex flex-col justify-between gap-8 flex-1"
        variants={sectionVariant}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        <p className="font-heading text-center md:text-left text-4xl lg:text-6xl font-bold">
          Bu seneki <br /> hisse bedellerimiz
        </p>

        <motion.div
          className="grid grid-cols-3 gap-8"
          variants={pricesGridVariant}
        >
          {priceItems.map((item, index) => (
            <div 
              key={index}
              className="flex flex-col items-center justify-between hover:scale-105 transition-all duration-300 cursor-pointer"
              onClick={() => router.push('/hisseal')}
            >
              <div className="flex items-center justify-center bg-black text-white text-base sm:text-lg font-medium px-2 py-1 rounded-md">
                {item.kg} KG
              </div>
              <div className="text-base sm:text-lg font-semibold bg-sac-primary text-white px-2 py-1 rounded-md">
                {item.price.toLocaleString('tr-TR')} TL
              </div>
            </div>
          ))}
        </motion.div>

        {/* Alt bilgi */}
        <div className="flex flex-col space-y-4">
          <p className="text-sm sm:text-base">
            * Kilogram bilgileri <b>±3 kg</b> arasında değişiklik
            gösterebilmektedir.
          </p>
          <div className="flex space-x-4">
            <Image
              src="/icons/location.svg"
              alt="Location Icon"
              width={24}
              height={24}
            />
            <p className="text-sm sm:text-base">
              Kurban kesim yerimiz, Kahramankazan'a bağlı Ciğir köyündedir.
              <br />
              <Link
                href="#"
                className="text-sac-primary hover:underline hover:text-primary-dark"
              >
                Konum için tıklayınız.
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Prices;
