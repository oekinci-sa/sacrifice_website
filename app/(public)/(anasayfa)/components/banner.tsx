"use client";

import EmptySharesBadge from "@/components/common/empty-shares-badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const Banner = () => {
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

  return (
    <motion.div initial="hidden" animate="show" variants={container}>
      <div className="container flex flex-col-reverse md:flex-row items-center justify-between gap-8 md:gap-4">
        {/* Mobile Image + Badge */}
        <motion.div
          variants={item}
          className="w-full md:hidden aspect-square relative mt-4 md:mt-0"
        >
          <Image
            src="/images/main-image.jpg"
            alt="Main Page Image"
            fill
            priority
            className="object-cover rounded-lg"
          />
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{
              duration: 1,
              repeat: 4,
              ease: "easeInOut",
            }}
            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
          >
            <EmptySharesBadge size="lg" />
          </motion.div>
        </motion.div>

        {/* Left Column */}
        <motion.div
          variants={item}
          className="flex flex-col gap-6 md:gap-6 md:gap-8 basis-full md:basis-3/5 text-left"
        >
          {/* Headline */}
          <div>
            <p className="text-3xl md:text-6xl font-bold md:mb-2">
              Kurban ibadetini
            </p>
            <p className="text-3xl md:text-6xl font-bold text-sac-primary">
              birlikte gerçekleştirelim.
            </p>
          </div>

          {/* Description */}
          <p className="text-base md:text-xl text-black/70 font-normal md:leading-relaxed -mt-2 md:mt-0">
            Allah&apos;a yakınlaşmak ve O&apos;nun rızasını kazanmak için gerçekleştireceğimiz bu güzel ibadeti gönül rahatlığıyla yerine getirmenize yardımcı olmaktan büyük mutluluk duyuyoruz.
          </p>

          {/* Buttons */}
          <div className="flex space-x-4 items-center justify-center md:justify-start">
            <Button
              size="xl"
              className="w-1/2 md:w-auto hover:scale-105 transition-all duration-300"
            >
              <Link href="/hisseal" className="flex items-center gap-4">
                <p>Hisse Al</p>
                <i className="bi bi-arrow-right" />
              </Link>
            </Button>
            <Button
              size="xl"
              variant="outline"
              className="w-1/2 md:w-auto border-[1.5px] border-black hover:scale-105 hover:bg-black hover:text-white transition-all duration-300"
            >
              <Link href="/hissesorgula">Hisse Sorgula</Link>
            </Button>
          </div>

          {/* Location */}
          <div className="flex space-x-4 items-start mt-2">
            <Image
              src="/icons/location.svg"
              alt="Location Icon"
              width={28}
              height={28}
              className="mt-1"
            />
            <p className="md:text-lg text-black/90">
              Kurban kesim yerimiz, Kahramankazan&apos;a bağlı<br className="block md:hidden" /> Ciğir köyündedir.
              <br className="hidden md:block" />
              <Link
                target="_blank"
                rel="noopener noreferrer"
                href="https://maps.app.goo.gl/yfA3h5mdS1uxAXTU9"
                className="text-sac-primary hover:underline hover:text-primary-dark ml-2 md:ml-0"
              >
                Konum için tıklayınız.
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Desktop Image + Badge */}
        <motion.div
          variants={item}
          className="hidden md:block w-1/3 relative aspect-square"
        >
          <Image
            src="/images/main-image.jpg"
            alt="Main Page Image"
            fill
            priority
            className="object-cover rounded-lg"
          />
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 0, 1] }}
            transition={{
              duration: 1,
              repeat: 4,
              ease: "easeInOut",
            }}
            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
          >
            <EmptySharesBadge size="lg" />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Banner;
