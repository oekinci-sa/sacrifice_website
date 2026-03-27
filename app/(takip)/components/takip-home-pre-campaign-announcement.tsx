"use client";

import { Separator } from "@/components/ui/separator";
import { motion, type Variants } from "framer-motion";
import RemindMe from "./remind-me";

const item: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

/**
 * bana_haber_ver evresi içeriği: duyuru metni + ayırıcı + "Bana Haber Ver" formu.
 * TakipHomeContent tarafından kullanılır; gerektiğinde başka yerde de mount edilebilir.
 */
export function TakipHomePreCampaignAnnouncement() {
  return (
    <>
      <motion.div
        className="flex flex-col items-center justify-center"
        variants={item}
      >
        <p className="md:w-2/3 text-muted-foreground text-center text-base md:text-xl">
          <br />
          2026 yılında da kurbanlıklarımızı en hijyenik <br />
          ve dini usullere uygun şekilde sizlerle buluşturacağız.
          <br />
          <br />
          Hazırlık sürecimiz devam ediyor; güncel duyurular ve bilgilendirmeler
          için sayfamızı takip etmeyi unutmayın.
          <br />
          <br /> Birlikte daha nice bayramlara...
        </p>
      </motion.div>

      <motion.div className="w-full flex justify-center" variants={item}>
        <Separator className="w-full md:w-1/2" />
      </motion.div>

      <motion.div
        className="w-full max-w-6xl flex mb-16 flex-col items-center"
        variants={item}
      >
        <div className="md:w-2/3 w-3/4">
          <RemindMe />
        </div>
      </motion.div>
    </>
  );
}
