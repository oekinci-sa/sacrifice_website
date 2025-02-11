import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const Banner = () => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 50 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
    >
      {/* Ayah */}
      <motion.div variants={item} className="container flex flex-col space-y-4 text-md -mt-8 md:-mt-4 mb-8 md:text-2xl text-center">
        <p className="font-medium">
          Şüphesiz kurbanlarınızın,{" "}
          <span className="text-sac-primary font-semibold">
            ne etleri ne de kanları
          </span>{" "}
          Allah&apos;a ulaşır.
          <br />
          Fakat O&apos;na sizin{" "}
          <span className="text-sac-primary font-semibold">
            takvanız{" "}
          </span>
          ulaşır.
        </p>
        <p className="font-normal text-sm md:text-xl">
          Hac Suresi, 37. Ayeti Kerime
        </p>
      </motion.div>

      <div className="container flex flex-col-reverse md:flex-row items-center justify-between gap-8 md:gap-4">
        {/* Image for mobile */}
        <motion.div variants={item} className="w-full md:hidden aspect-square relative">
          <Image
            src="/images/main-image.jpg"
            alt="Main Page Image"
            fill
            priority
            className="object-cover rounded-lg"
          />
        </motion.div>

        {/* Left */}
        <motion.div variants={item} className="flex flex-col gap-6 md:gap-8 font-heading basis-full md:basis-3/5 text-left">
          {/* Ana başlık */}
          <div>
            <p className="text-3xl md:text-6xl font-heading font-bold mb-2">
              Kurban ibadetini
            </p>
            <p className="text-3xl md:text-6xl font-heading font-bold text-sac-primary">
              birlikte gerçekleştirelim.
            </p>
          </div>

          {/* Açıklama */}
          <p className="text-lg md:text-2xl text-black/70 font-normal tracking-wide leading-relaxed">
            Yılları aşkın tecrübemizle binlerce hissedarı <br className="hidden md:block" />
            bu sene de bir araya getiriyoruz.
          </p>

          {/* Buttons */}
          <div className="flex space-x-4 items-center justify-center md:justify-start">
            <Button size="xl" className="w-1/2 md:w-auto hover:scale-105 transition-all duration-300">
              <Link href="/hisseal" className="flex items-center gap-4">
                <p>Hisse Al</p>
                <i className="bi bi-arrow-right"></i>
              </Link>
            </Button>
            <Button size="xl" variant="outline" className="w-1/2 md:w-auto border-[1.5px] border-black hover:scale-105 hover:bg-black hover:text-white transition-all duration-300">
              <Link href="/hissesorgula">Hisse Sorgula</Link>
            </Button>
          </div>
        </motion.div>

        {/* Right - Desktop Image */}
        <motion.div variants={item} className="hidden md:block w-1/3 relative aspect-square">
          <Image
            src="/images/main-image.jpg"
            alt="Main Page Image"
            fill
            priority
            className="object-cover rounded-lg"
          />
          <div className="absolute -left-16 -top-8 z-10">
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
    </motion.div>
  );
};

export default Banner;
