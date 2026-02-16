"use client";

import { ShareholderLookup } from "@/components/common/shareholder-lookup";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import RemindMe from "./components/remind-me";

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
      className="container flex flex-col  items-center"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <div className="flex flex-col gap-8 md:gap-12">

        {/* Thank you message */}
        <motion.div
          className="flex flex-col items-center justify-center"
          variants={item}
        >
          {/* Check Icon */}
          <i className="bi bi-patch-check-fill text-8xl text-sac-primary mb-6 md:mb-8" />

          {/* Thank you message */}
          <h1 className="text-2xl md:text-4xl text-center font-bold mb-4">
            2026 Kurban Satışlarımız Çok Yakında Başlıyor
          </h1>

          <p className="md:w-2/3 text-muted-foreground text-center text-base md:text-xl">
            <br/>2026 yılında da kurbanlıklarımızı en hijyenik <br/>ve dini usullere uygun şekilde sizlerle buluşturacağız.
            <br/>
            <br/>Hazırlık sürecimiz devam ediyor; güncel duyurular ve bilgilendirmeler için sayfamızı takip etmeyi unutmayın.
            <br/>
            <br/> Birlikte daha nice bayramlara...
            
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
          className="w-full max-w-6xl flex mb-16 flex-col items-center"
          variants={item}
        >
          {/* <p className="text-center text-base md:text-2xl font-bold mb-4 md:mb-6">
            Hisse bilgilerinizi öğrenmek ister misiniz?
          </p> */}
          <div className="md:w-2/3 w-3/4">
            <RemindMe/>
          </div>
        </motion.div>

      </div>

    </motion.div>
  );
};

export default page;
