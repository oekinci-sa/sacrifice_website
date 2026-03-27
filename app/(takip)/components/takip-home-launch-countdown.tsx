"use client";

import Prices from "@/app/(public)/(anasayfa)/components/prices";
import { motion, type Variants } from "framer-motion";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.3 },
  },
};

const item: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

/**
 * launch_countdown evresi: başlık + satış başlangıç duyurusu + fiyat listesi (TÜKENDİ gösterilmez).
 * Hisseal'a yönlendirme devre dışı (disableHissealNavigation).
 */
export default function TakipHomeLaunchCountdown() {
  return (
    <motion.div
      className="container flex flex-col items-center"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <div className="flex flex-col gap-8 md:gap-12">
        <motion.div
          className="flex flex-col items-center justify-center"
          variants={item}
        >
          <i className="bi bi-patch-check-fill text-8xl text-primary mb-6 md:mb-8" />
          <h1 className="text-2xl md:text-4xl text-center font-bold mb-4">
            Yakında Açılıyor
          </h1>
          <p className="md:w-2/3 text-muted-foreground text-center text-base md:text-xl max-w-3xl">
            Hisse alım işlemlerimiz 28 Mart Cumartesi günü saat 09.00 itibarıyla aktif olacaktır.
          </p>
        </motion.div>

        <motion.div className="w-full" variants={item}>
          <Prices disableHissealNavigation hideSoldOutBadge />
        </motion.div>
      </div>
    </motion.div>
  );
}
