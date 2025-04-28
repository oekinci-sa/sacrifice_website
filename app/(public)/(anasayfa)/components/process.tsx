import React from "react";
import { motion } from "framer-motion";
import { processes } from "../constants";

const Process = () => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 50 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const numberVariant = {
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

  return (
    <div id="process" className="md:bg-transparent bg-sac-section-background">
      {/* Heading - white on mobile, hidden on desktop */}
      <motion.p 
        className="text-3xl md:text-4xl font-bold text-center text-white my-12 md:hidden"
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        Hisse Alım Sürecimiz
      </motion.p>

      <motion.div 
        className="container grid grid-cols-1 md:grid-cols-3 gap-x-24 gap-y-12 md:gap-y-16 pb-16 md:pb-20"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
      >
        {/* Tüm süreç öğeleri için tek kapsayıcı */}
        <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-y-12 md:gap-x-24 justify-items-center">
          {processes.map((process) => (
            <motion.div
              key={process.number}
              className="flex flex-col px-12 md:px-0 items-center gap-2 md:gap-4 text-center"
              variants={item}
            >
              {/* Numaralandırma */}
              <motion.div 
                className="flex items-center justify-center rounded-sm bg-sac-green-lightest text-sac-primary w-14 h-14 md:w-20 md:h-20 text-2xl md:text-4xl font-semibold mb-2 md:mb-0"
                variants={numberVariant}
              >
                {process.number}
              </motion.div>
              <p className="text-xl md:text-2xl font-bold text-white md:text-black">
                {process.header}
              </p>
              <p className="text-base md:text-base text-white/90 md:text-black/80">
                {process.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Process;
