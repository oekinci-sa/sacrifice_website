"use client";

import Prices from "@/app/(public)/(anasayfa)/components/prices";
import { usePriceInfo } from "@/hooks/usePriceInfo";
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

/** Fiyat API’si gelene kadar başlık + liste parçalanmasın diye tüm blok iskelet */
function TakipHomeLaunchCountdownSkeleton() {
  return (
    <div
      className="container flex flex-col items-center animate-pulse"
      aria-busy
      aria-label="Yükleniyor"
    >
      <div className="flex flex-col gap-8 md:gap-12 w-full max-w-6xl">
        <div className="flex flex-col items-center justify-center">
          <div className="h-[4.5rem] w-[4.5rem] md:h-24 md:w-24 rounded-full bg-muted mb-6 md:mb-8" />
          <div className="h-9 md:h-11 w-56 max-w-full rounded-md bg-muted mb-4" />
          <div className="h-5 w-full max-w-xl rounded-md bg-muted mb-2" />
          <div className="h-5 w-full max-w-lg rounded-md bg-muted" />
        </div>
        <div className="w-full space-y-6 md:space-y-8">
          <div className="h-9 md:h-10 w-64 mx-auto rounded-md bg-muted" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-x-24 md:gap-y-12 justify-items-center">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex w-full max-w-[140px] flex-col items-center gap-2">
                <div className="h-8 w-full max-w-[5rem] rounded-md bg-muted" />
                <div className="h-10 w-full rounded-md bg-muted" />
              </div>
            ))}
          </div>
          <div className="mx-auto h-4 w-full max-w-md rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

/**
 * geri_sayim evresi: başlık + satış başlangıç duyurusu + fiyat listesi (TÜKENDİ gösterilmez).
 * Hisseal'a yönlendirme devre dışı (disableHissealNavigation).
 */
export default function TakipHomeLaunchCountdown() {
  const { items, loading } = usePriceInfo();

  if (loading) {
    return <TakipHomeLaunchCountdownSkeleton />;
  }

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
            Yakında Açılıyor...
          </h1>
          <p className="text-muted-foreground text-center text-base md:text-xl max-w-3xl">
            Hisse alım işlemlerimiz 28 Mart Cumartesi günü itibarıyla aktif olacaktır.
          </p>
        </motion.div>

        <motion.div className="w-full" variants={item}>
          <Prices
            prefetchedItems={items}
            disableHissealNavigation
            hideSoldOutBadge
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
