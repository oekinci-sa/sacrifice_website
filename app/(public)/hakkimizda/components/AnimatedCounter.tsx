'use client';

import { motion, useAnimation, useInView } from "framer-motion";
import { useEffect, useRef, useState } from 'react';

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

const AnimatedCounter = () => {
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
    <div className="py-8 md:py-16">
      <div className="mx-auto">
        <motion.div
          className="flex flex-wrap justify-between md:gap-16"
          variants={sectionVariant}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {/* 7 Yıl+ Tecrübe */}
          <motion.div
            className="flex flex-col items-center justify-center bg-black text-white rounded-md px-4 py-2 md:px-8 md:py-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-xl md:text-4xl font-bold">
              <Counter from={0} to={7} duration={1.5} />
              &nbsp;Yıl<span className="text-sac-primary">+</span>
            </p>
            <p className="text-lg md:text-3xl">Tecrübe</p>
          </motion.div>

          {/* 1000+ Kurban */}
          <motion.div
            className="flex flex-col items-center justify-center bg-sac-primary text-white rounded-md px-4 py-2 md:px-8 md:py-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-xl md:text-4xl font-bold">
              <Counter from={0} to={1000} duration={1.5} />
              <span>+</span>
            </p>
            <p className="text-lg md:text-3xl">Kurban</p>
          </motion.div>

          {/* 5000+ Hissedar */}
          <motion.div
            className="flex flex-col items-center justify-center bg-black text-white rounded-md px-4 py-2 md:px-8 md:py-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-xl md:text-4xl font-bold">
              <Counter from={0} to={5000} duration={1.5} />
              <span>+</span>
            </p>
            <p className="text-lg md:text-3xl">Hissedar</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnimatedCounter; 