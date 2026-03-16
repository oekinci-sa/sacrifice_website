"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PriceItem {
  kg: number;
  price: number;
  soldOut: boolean;
}

const Prices = () => {
  const router = useRouter();
  const [priceItems, setPriceItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/price-info")
      .then((res) => res.json())
      .then((data: PriceItem[]) => {
        if (Array.isArray(data)) {
          setPriceItems(data);
        }
      })
      .catch(() => setPriceItems([]))
      .finally(() => setLoading(false));
  }, []);

  // Container animation for staggered children
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const boxVariant = {
    hidden: { scale: 0.5, opacity: 0 },
    show: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 200, damping: 15 },
    },
  };

  const itemVariant = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const sectionVariant = {
    hidden: { opacity: 0, y: 50 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  if (loading || priceItems.length === 0) {
    return null;
  }

  return (
    <section className="container mx-auto">
      <motion.div
        className="w-full flex flex-col gap-8 md:gap-12 items-center"
        variants={sectionVariant}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-center">
          Bu Seneki Hisse Bedellerimiz
        </h2>

        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 md:gap-x-24 md:gap-y-12 items-start"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {priceItems.map((item) => (
            <motion.div
              key={`${item.kg}-${item.price}`}
              className={`flex flex-col items-center transition-all duration-300 ${
                item.soldOut ? "cursor-not-allowed" : "cursor-pointer hover:scale-105"
              }`}
              onClick={() => {
                if (!item.soldOut) {
                  router.push(`/hisseal?price=${item.price}`);
                }
              }}
              variants={itemVariant}
            >
              <motion.div
                className="flex items-center justify-center bg-black text-white text-base md:text-2xl font-medium px-2 py-1 rounded-md"
                variants={boxVariant}
              >
                {item.kg} KG
              </motion.div>
              <motion.div
                className={`flex items-center justify-center bg-primary text-white text-base md:text-2xl font-semibold px-2 py-1 w-full text-center ${
                  item.soldOut ? "rounded-t-md" : "rounded-md"
                }`}
                variants={boxVariant}
              >
                {item.price.toLocaleString("tr-TR")} TL
              </motion.div>
              {item.soldOut && (
                <motion.div
                  className="inline-flex items-center justify-center bg-sac-red text-white text-xs md:text-base font-semibold px-2 py-0.5 rounded-b-md -mt-px mx-auto"
                  variants={boxVariant}
                >
                  TÜKENDİ
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>

        <p className="text-sm md:text-base text-center max-w-2xl">
          <span>
            * Kilogram bilgileri <b>±3 kg</b> arasında değişiklik gösterebilmektedir.
          </span>
          <span className="block mt-2">
            * Kapora ücreti <b>10.000 TL</b>&apos;dir.
          </span>
        </p>
      </motion.div>
    </section>
  );
};

export default Prices;
