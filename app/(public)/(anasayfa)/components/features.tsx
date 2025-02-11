import React from "react";
import { motion } from "framer-motion";
import { features } from "../constants";
import Image from "next/image";

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
      className="container flex flex-wrap justify-between"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
    >
      {features.map((feature, index) => (
        <motion.div 
          key={feature.src} 
          className="flex flex-col flex-center w-80"
          variants={item}
        >
          <Image
            src={`/icons/${feature.src}`}
            alt={feature.header}
            width={24}
            height={24}
            className="min-h-16"
          />
          <div className="flex flex-col justify-between">
            <p className="font-heading text-xl font-bold">{feature.header}</p>
            <p>{feature.description}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default Features;
