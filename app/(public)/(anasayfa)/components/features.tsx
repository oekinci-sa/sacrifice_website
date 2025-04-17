import { motion } from "framer-motion";
import Image from "next/image";
import { features } from "../constants";

const Features = () => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
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

  return (
    <motion.div
      className="container grid grid-cols-2 sm:grid-cols-4 items-start lg:flex lg:flex-wrap lg:justify-between gap-8"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
    >
      {features.map((feature) => (
        <motion.div
          key={feature.src}
          className="flex items-start gap-4 w-full sm:max-w-[300px]"
          variants={item}
        >
          <Image
            src={`/icons/${feature.src}`}
            alt={feature.header}
            width={24}
            height={24}
            className="mt-1"
          />
          <div className="flex flex-col gap-2">
            <p className="text-lg md:text-xl font-bold">{feature.header}</p>
            <p className="text-sm md:text-base">{feature.description}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default Features;
