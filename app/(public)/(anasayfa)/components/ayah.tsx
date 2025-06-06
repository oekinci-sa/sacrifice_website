"use client";

import { motion } from "framer-motion";

const Ayah = () => {
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      variants={item}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className="container flex flex-col space-y-2 md:space-y-4 z-60 mt-8 text-lg md:text-xl text-center"
    >
      <p className="font-medium">
        Şüphesiz kurbanlarınızın,{" "}
        <br className="block md:hidden" />
        <span className="text-sac-primary font-semibold">
          ne etleri ne de kanları
        </span>{" "}
        Allah&apos;a ulaşır.
        <br />
        Fakat O&apos;na sizin ancak{" "}
        <span className="text-sac-primary font-semibold">
          takvanız{" "}
        </span>
        ulaşır.
      </p>
      <p className="font-normal text-sm md:text-lg">
        Hac Suresi, 37. Ayeti Kerime
      </p>
    </motion.div>
  );
};

export default Ayah; 