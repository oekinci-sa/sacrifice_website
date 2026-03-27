"use client";

import { motion, type Variants } from "framer-motion";
import { TakipHomePreCampaignAnnouncement } from "./takip-home-pre-campaign-announcement";

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
 * bana_haber_ver evresi: duyuru metni + "Bana Haber Ver" formu.
 */
export default function TakipHomeContent() {
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
            2026 Kurban Satışlarımız Çok Yakında Başlıyor
          </h1>
        </motion.div>

        <TakipHomePreCampaignAnnouncement />
      </div>
    </motion.div>
  );
}
