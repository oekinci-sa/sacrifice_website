"use client";

import Ayah from "@/app/(public)/(anasayfa)/components/ayah";
import QueueCard from "@/app/(takip)/components/queue-card";
import { ShareholderLookup } from "@/components/common/shareholder-lookup";
import { motion } from "framer-motion";

const page = () => {
  // Container animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  };

  // Individual item animation variants
  const item = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.95
    },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  // Special variant for cards with a different animation
  const cardItem = {
    hidden: {
      opacity: 0,
      y: 40,
      rotateY: -15
    },
    show: {
      opacity: 1,
      y: 0,
      rotateY: 0,
      transition: {
        duration: 0.7,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      className="container flex flex-col items-center justify-center gap-12 md:gap-16"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Title */}
      <motion.h1
        className="text-3xl md:text-4xl font-bold mt-8 text-center"
        variants={item}
      >
        Kurbanlık Takip<br className="md:hidden" /> Sayfası
      </motion.h1>

      {/* Ayah */}
      <motion.div
        className="-mt-8"
        variants={item}
      >
        <Ayah />
      </motion.div>

      {/* Queue Cards */}
      <motion.div
        className="grid grid-cols-2 gap-8 md:flex md:flex-row md:gap-16"
        variants={container}
      >
        <motion.div variants={cardItem}>
          <QueueCard title="Kesim Sırası" stage="slaughter_stage" />
        </motion.div>

        <motion.div variants={cardItem}>
          <QueueCard title="Parçalama Sırası" stage="butcher_stage" />
        </motion.div>

        <motion.div
          className="col-span-2 flex justify-center"
          variants={cardItem}
        >
          <QueueCard title="Teslimat Sırası" stage="delivery_stage" />
        </motion.div>
      </motion.div>

      {/* Shareholder Lookup */}
      <motion.div
        className="w-full max-w-6xl mb-8"
        variants={item}
      >
        <motion.p
          className="text-center text-lg md:text-2xl font-semibold mb-4 md:mb-8"
          variants={item}
        >
          Hisse bilgilerinizi unuttunuz mu?
        </motion.p>
        <motion.div variants={item}>
          <ShareholderLookup />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default page;
