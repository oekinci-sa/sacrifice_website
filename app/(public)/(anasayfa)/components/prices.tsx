"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { motion, useInView, useAnimation } from "framer-motion";
import { priceInfo } from "@/app/(public)/(anasayfa)/constants";

interface CounterProps {
  from: number;
  to: number;
  duration?: number;
}

const Counter = ({ from, to, duration = 1.5 }: CounterProps) => {
  const [count, setCount] = useState(from);
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    let animationFrame: number | null = null;

    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = (timestamp - startTime) / (duration * 1000);

      if (progress < 1) {
        setCount(Math.floor(from + (to - from) * progress));
        animationFrame = requestAnimationFrame(updateCount);
      } else {
        setCount(to);
      }
    };

    controls.start({ opacity: 1 }).then(() => {
      animationFrame = requestAnimationFrame(updateCount);
    });

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [from, to, duration, controls, isInView]);

  return <span ref={ref}>{count}</span>;
};

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

  // Item animation from Process component
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
              variants={item}
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
