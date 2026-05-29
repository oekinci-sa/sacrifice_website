"use client";

import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
    },
  },
};

const item = {
  hidden: {
    opacity: 0,
  },
  show: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export default function KurbanGunuSonrasiContent() {
  return (
    <motion.div
      className="container flex flex-col mt-24 mb-12 md:my-18 lg:my-32 items-center"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className="flex flex-col items-center justify-center gap-8 md:gap-12"
        variants={item}
      >
        <i className="bi bi-patch-check-fill text-8xl text-primary mb-6 md:mb-8" />

        <h1 className="text-2xl md:text-4xl text-center font-bold mb-4">
          Teşekkürler...
        </h1>

        <p className="text-muted-foreground text-center text-base md:text-xl">
          Bu sene de yüksek teveccühlerinizle <br className="md:hidden" />
          tüm hisselerimiz satılmıştır.
        </p>
      </motion.div>
    </motion.div>
  );
}
