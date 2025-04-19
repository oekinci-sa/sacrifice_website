import EmptySharesBadge from "@/components/common/empty-shares-badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const Banner = () => {

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

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
    >
      <div className="container flex flex-col-reverse md:flex-row items-center justify-between gap-8 md:gap-4">
        {/* Image for mobile */}
        <motion.div variants={item} className="w-full md:hidden aspect-square relative">
          <Image
            src="/images/main-image.jpg"
            alt="Main Page Image"
            fill
            priority
            className="object-cover rounded-lg"
          />
        </motion.div>

        {/* Left */}
        <motion.div variants={item} className="flex flex-col gap-4 md:gap-6 md:gap-8 basis-full md:basis-3/5 text-left">
          {/* Ana başlık */}
          <div>
            <p className="text-3xl md:text-6xl font-bold md:mb-2">
              Kurban ibadetini
            </p>
            <p className="text-3xl md:text-6xl font-bold text-sac-primary">
              birlikte gerçekleştirelim.
            </p>
          </div>

          {/* Açıklama */}
          <p className="md:text-xl text-black/70 font-normal md:leading-loose">
            İMH Ankara Kurban organizasyonu olarak, Allah&apos;a yakınlaşmak ve O&apos;nun rızasını kazanmak için yerine getirdiğimiz bu güzel ibadeti gönül rahatlığıyla yerine getirmenize yardımcı olmaktan büyük mutluluk duyuyoruz.
          </p>

          {/* Buttons */}
          <div className="flex space-x-4 items-center justify-center md:justify-start">
            <Button size="xl" className="w-1/2 md:w-auto hover:scale-105 transition-all duration-300">
              <Link href="/hisseal" className="flex items-center gap-4">
                <p>Hisse Al</p>
                <i className="bi bi-arrow-right"></i>
              </Link>
            </Button>
            <Button size="xl" variant="outline" className="w-1/2 md:w-auto border-[1.5px] border-black hover:scale-105 hover:bg-black hover:text-white transition-all duration-300">
              <Link href="/hissesorgula">Hisse Sorgula</Link>
            </Button>
          </div>

          {/* Location information */}
          <div className="flex space-x-4 items-center mt-2">
            <Image
              src="/icons/location.svg"
              alt="Location Icon"
              width={24}
              height={24}
            />
            <p className="text-sm md:text-base text-black/70">
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
        </motion.div>

        {/* Right - Desktop Image */}
        <motion.div variants={item} className="hidden md:block w-1/3 relative aspect-square">
          <div className="relative w-full h-full">
            <Image
              src="/images/main-image.jpg"
              alt="Main Page Image"
              fill
              priority
              className="object-cover rounded-lg"
            />
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <EmptySharesBadge size="lg" />
            </div>
          </div>
          <div className="absolute -left-16 -top-8 z-10">
            <Image
              src="/icons/three-lines.svg"
              alt="Decorative Lines"
              width={120}
              height={120}
              className="opacity-80"
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Banner;
