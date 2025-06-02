"use client";

import { ShareholderLookup } from "@/components/common/shareholder-lookup";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

const page = () => {
  // Container with staggered children
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  // Simple fade-in for each item
  const item = {
    hidden: {
      opacity: 0
    },
    show: {
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      className="container space-y-8 flex flex-col items-center justify-center"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className="flex flex-col items-center justify-center"
        variants={item}
      >
        {/* Check Icon */}
        <i className="bi bi-patch-check-fill text-8xl text-sac-primary mb-6 md:mb-8" />

        {/* Thank you message */}
        <h1 className="text-2xl md:text-4xl text-center font-bold mb-4">
          Teşekkürler...
        </h1>

        <p className="text-muted-foreground text-center text-base md:text-xl">
          Bu sene de yüksek teveccühlerinizle <br className="md:hidden" />tüm hisselerimiz satılmıştır.
        </p>
      </motion.div>

      {/* Separator */}
      <motion.div
        className="w-full flex justify-center"
        variants={item}
      >
        <Separator className="w-full md:w-1/2" />
      </motion.div>

      {/* Shareholder Lookup */}
      <motion.div
        className="w-full max-w-6xl mb-8"
        variants={item}
      >
        <p className="text-center text-lg md:text-2xl font-bold mb-4 md:mb-6">
          Hisse bilgilerinizi öğrenmek ister misiniz?
        </p>

        <ShareholderLookup />
      </motion.div>
    </motion.div>
  );
};

export default page;
