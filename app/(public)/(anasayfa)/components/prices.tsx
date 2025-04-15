"use client";
import { priceInfo } from "@/app/(public)/(anasayfa)/constants";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const Prices = () => {
  const router = useRouter();
  const priceItems = priceInfo.map(item => ({
    kg: parseInt(item.kg.split(" ")[0]),
    price: parseInt(item.price.replace(".", ""))
  }));

  // Container animation for staggered children
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  // Box animation similar to numberVariant in Process
  const boxVariant = {
    hidden: {
      scale: 0.5,
      opacity: 0
    },
    show: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15
      }
    }
  };

  // Item animation variant
  const itemVariant = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  const sectionVariant = {
    hidden: { opacity: 0, y: 50 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="container mx-auto">
      <motion.div
        className="w-full flex flex-col gap-8 items-center"
        variants={sectionVariant}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        {/* Title for both mobile and desktop */}
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-4">
          Bu seneki hisse bedellerimiz
        </h2>

        {/* Centered compact grid with staggered children animations */}
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
                className="flex items-center justify-center bg-black text-white text-base md:text-2xl 
              font-medium px-2 py-1 rounded-md"
                variants={boxVariant}
              >
                {item.kg} KG
              </motion.div>
              <motion.div
                className="text-base sm:text-2xl font-semibold bg-sac-primary text-white px-2 py-1 rounded-md w-full text-center"
                variants={boxVariant}
              >
                {item.price.toLocaleString('tr-TR')} TL
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Centered note */}
        <p className="text-sm sm:text-base text-center max-w-2xl mt-4">
          * Kilogram bilgileri <b>±3 kg</b> arasında değişiklik
          gösterebilmektedir.
        </p>
      </motion.div>
    </section>
  );
};

export default Prices;
