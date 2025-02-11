import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { motion, useInView, useAnimation } from "framer-motion";

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
  const priceItems = Array.from({ length: 9 }, (_, i) => ({
    kg: 26 + (i * 4),
    price: 30000 + (i * 6000)
  }));

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

  const pricesGridVariant = {
    hidden: { opacity: 0 },
    show: { 
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="container flex flex-col lg:flex-row lg:space-x-16 space-y-16 lg:space-y-0">
      {/* Sol kısım */}
      <motion.div 
        className="flex items-start space-x-4 w-full lg:w-auto"
        variants={sectionVariant}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        {/* Left Image */}
        <div className="relative w-1/2 sm:w-80 aspect-[4/5] md:aspect-[3/4]">
          <Image
            src="/images/left-image.jpg"
            alt="Left Side Image"
            fill
            priority
            className="object-cover rounded-lg"
          />
          <Image
            src="/icons/birds.svg"
            alt="Birds Icon"
            width={96}
            height={96}
            priority
            className="absolute right-4 lg:scale-150 -bottom-12 lg:right-12 lg:-bottom-18"
          />
        </div>

        {/* Right Image and Two Rectangulars */}
        <div className="flex flex-col w-1/2 items-center space-y-4">
          {/* İkili */}
          <div className="flex sm:flex-row justify-between sm:gap-4 w-full">
            {/* 7 Yıl+ */}
            <motion.div 
              className="flex flex-col items-center justify-center bg-black text-white rounded-md p-2 w-full sm:w-36 h-20 sm:h-36"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <p className="text-base sm:text-4xl font-bold">
                <Counter from={0} to={7} duration={1.5} />
                &nbsp;Yıl<span className="text-sac-primary">+</span>
              </p>
              <p className="text-base sm:text-3xl">Tecrübe</p>
            </motion.div>
            {/* 1000+ */}
            <motion.div 
              className="flex flex-col items-center justify-center bg-sac-primary text-white rounded-md p-2 w-full sm:w-36 h-20 sm:h-36"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <p className="text-base sm:text-4xl font-bold">
                <Counter from={0} to={1000} duration={1.5} />
                <span>+</span>
              </p>
              <p className="text-base sm:text-3xl">Kurban</p>
            </motion.div>
          </div>
          <div className="relative w-full sm:w-80 aspect-[4/5] md:aspect-[3/4]">
            <Image
              src="/images/right-image.jpg"
              alt="Right Side Image"
              fill
              priority
              className="object-cover rounded-lg"
            />
          </div>
        </div>
      </motion.div>

      {/* Sağ kısım */}
      <motion.div 
        className="flex flex-col justify-between gap-8 flex-1"
        variants={sectionVariant}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        <p className="font-heading text-center md:text-left text-4xl lg:text-6xl font-bold">
          Bu seneki <br /> hisse bedellerimiz
        </p>

        <motion.div
          className="grid grid-cols-3 gap-8"
          variants={pricesGridVariant}
        >
          {priceItems.map((item, index) => (
            <div 
              key={index}
              className="flex flex-col items-center justify-between hover:scale-105 transition-all duration-300 cursor-pointer"
              onClick={() => router.push('/hisseal')}
            >
              <div className="flex items-center justify-center bg-black text-white text-base sm:text-lg font-medium px-2 py-1 rounded-md">
                {item.kg} KG
              </div>
              <div className="text-base sm:text-lg font-semibold bg-sac-primary text-white px-2 py-1 rounded-md">
                {item.price.toLocaleString('tr-TR')} TL
              </div>
            </div>
          ))}
        </motion.div>

        {/* Alt bilgi */}
        <div className="flex flex-col space-y-4">
          <p className="text-sm sm:text-base">
            * Kilogram bilgileri <b>±3 kg</b> arasında değişiklik
            gösterebilmektedir.
          </p>
          <div className="flex space-x-4">
            <Image
              src="/icons/location.svg"
              alt="Location Icon"
              width={24}
              height={24}
            />
            <p className="text-sm sm:text-base">
              Kurban kesim yerimiz, Kahramankazan&apos;a bağlı Ciğir köyündedir.
              <br />
              <Link
                href="#"
                className="text-sac-primary hover:underline hover:text-primary-dark"
              >
                Konum için tıklayınız.
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Prices;
