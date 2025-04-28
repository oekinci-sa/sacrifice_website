"use client";
import { priceInfo } from "@/app/(public)/(anasayfa)/constants";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const Prices = () => {
  const router = useRouter();

  const priceItems = priceInfo.map((item) => ({
    kg: parseInt(item.kg.split(" ")[0], 10),
    price: parseInt(item.price.replace(".", ""), 10),
  }));

  // Container animation for staggered children
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  // Box animation (scale + fade)
  const boxVariant = {
    hidden: { scale: 0.5, opacity: 0 },
    show: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 200, damping: 15 },
    },
  };

  // **Y-axis slide removed**: now only fades in
  const itemVariant = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  // Section wrapper animation (can keep or remove y if desired)
  const sectionVariant = {
    hidden: { opacity: 0, y: 50 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

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

        {/* Price Items */}
        <motion.div
          className="grid grid-cols-3 md:grid-cols-4 gap-8 md:gap-x-24 md:gap-y-12"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {priceItems.map((item, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center justify-between hover:scale-105 transition-all duration-300 cursor-pointer"
              onClick={() => router.push(`/hisseal?price=${item.price}`)}
              variants={itemVariant}
            >
              <motion.div
                className="flex items-center justify-center bg-black text-white text-base md:text-2xl font-medium px-2 py-1 rounded-md"
                variants={boxVariant}
              >
                {item.kg} KG
              </motion.div>
              <motion.div
                className="text-base md:text-2xl font-semibold bg-sac-primary text-white px-2 py-1 rounded-md w-full text-center"
                variants={boxVariant}
              >
                {item.price.toLocaleString("tr-TR")} TL
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Price Notes */}
        <p className="text-sm md:text-base text-center max-w-2xl">
          <span>
            * Kilogram bilgileri <b>±3 kg</b> arasında değişiklik gösterebilmektedir.
          </span>
          <span className="block mt-2">
            * Kapora ücreti <b>5000 TL</b>'dir.
          </span>
        </p>
      </motion.div>
    </section>
  );
};

export default Prices;
