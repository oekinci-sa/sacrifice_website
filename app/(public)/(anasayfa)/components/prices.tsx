"use client";

import { useTenantBranding } from "@/hooks/useTenantBranding";
import { motion, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PriceItem {
  kg: number;
  price: number;
  soldOut: boolean;
}

function PriceCard({
  item,
  disableHissealNavigation,
  hideSoldOutBadge,
  router,
  itemVariant,
  boxVariant,
}: {
  item: PriceItem;
  disableHissealNavigation: boolean;
  hideSoldOutBadge: boolean;
  router: ReturnType<typeof import("next/navigation").useRouter>;
  itemVariant: Variants;
  boxVariant: Variants;
}) {
  const effectiveSoldOut = item.soldOut && !hideSoldOutBadge;
  return (
    <motion.div
      className={`flex flex-col items-center transition-all duration-300 ${
        effectiveSoldOut
          ? "cursor-not-allowed"
          : disableHissealNavigation
            ? "cursor-default"
            : "cursor-pointer hover:scale-105"
      }`}
      onClick={() => {
        if (disableHissealNavigation || effectiveSoldOut) return;
        router.push(`/hisseal?price=${item.price}`);
      }}
      variants={itemVariant}
    >
      <motion.div
        className="flex items-center justify-center bg-black text-white text-base md:text-2xl font-medium px-2 py-1 rounded-md"
        variants={boxVariant}
      >
        {item.kg} KG
      </motion.div>
      <motion.div
        className={`flex items-center justify-center bg-primary text-white text-base md:text-2xl font-semibold px-2 py-1 w-full text-center ${
          effectiveSoldOut ? "rounded-t-md" : "rounded-md"
        }`}
        variants={boxVariant}
      >
        {item.price.toLocaleString("tr-TR")} TL
      </motion.div>
      {effectiveSoldOut && (
        <motion.div
          className="inline-flex items-center justify-center bg-sac-red text-white text-xs md:text-base font-semibold px-2 py-0.5 rounded-b-md -mt-px mx-auto"
          variants={boxVariant}
        >
          TÜKENDİ
        </motion.div>
      )}
    </motion.div>
  );
}

interface PricesProps {
  /** true ise kartlara tıklanınca hisseal sayfasına gidilmez (ör. takip anasayfası gömülü fiyat listesi). */
  disableHissealNavigation?: boolean;
  /** true ise "TÜKENDİ" rozeti ve satışa kapalı görünümü gösterilmez (ör. launch_countdown önizleme). */
  hideSoldOutBadge?: boolean;
}

const Prices = ({
  disableHissealNavigation = false,
  hideSoldOutBadge = false,
}: PricesProps) => {
  const branding = useTenantBranding();
  const router = useRouter();
  const [priceItems, setPriceItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/price-info")
      .then((res) => res.json())
      .then((data: PriceItem[]) => {
        if (Array.isArray(data)) {
          setPriceItems(data);
        }
      })
      .catch(() => setPriceItems([]))
      .finally(() => setLoading(false));
  }, []);

  // Container animation for staggered children
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const boxVariant = {
    hidden: { scale: 0.5, opacity: 0 },
    show: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 200, damping: 15 },
    },
  };

  const itemVariant = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const sectionVariant = {
    hidden: { opacity: 0, y: 50 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  if (loading || priceItems.length === 0) {
    return null;
  }

  const total = priceItems.length;
  /** Mobil: 2 sütun; tam satırlardan sonra kalan tek/çift kart alt satırda ortalı */
  const fullRowsMobile = Math.floor(total / 2) * 2;
  const firstPartMobile = priceItems.slice(0, fullRowsMobile);
  const lastPartMobile = priceItems.slice(fullRowsMobile);
  /** md+: 4 sütun; son satır ortalı */
  const fullRowsDesktop = Math.floor(total / 4) * 4;
  const firstPartDesktop = priceItems.slice(0, fullRowsDesktop);
  const lastPartDesktop = priceItems.slice(fullRowsDesktop);

  const cardProps = {
    disableHissealNavigation,
    hideSoldOutBadge,
    router,
    itemVariant,
    boxVariant,
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

        <motion.div
          className="w-full"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {/* Mobil / sm: yalnızca 2 sütun; eksik son satır col-span-2 + flex ile ortalı */}
          <div className="md:hidden grid grid-cols-2 gap-4 gap-y-8 items-start justify-items-center">
            {firstPartMobile.map((item) => (
              <PriceCard
                key={`m-${item.kg}-${item.price}`}
                item={item}
                {...cardProps}
              />
            ))}
            {lastPartMobile.length > 0 && (
              <div className="col-span-2 flex flex-wrap justify-center gap-4 gap-y-8">
                {lastPartMobile.map((item) => (
                  <PriceCard
                    key={`m-last-${item.kg}-${item.price}`}
                    item={item}
                    {...cardProps}
                  />
                ))}
              </div>
            )}
          </div>

          {/* md+: 4 sütun */}
          <div className="hidden md:grid md:grid-cols-4 md:gap-8 md:gap-x-24 md:gap-y-12 items-start justify-items-center">
            {firstPartDesktop.map((item) => (
              <PriceCard
                key={`d-${item.kg}-${item.price}`}
                item={item}
                {...cardProps}
              />
            ))}
            {lastPartDesktop.length > 0 && (
              <div className="col-span-4 flex flex-wrap justify-center gap-8 gap-x-24 gap-y-12">
                {lastPartDesktop.map((item) => (
                  <PriceCard
                    key={`d-last-${item.kg}-${item.price}`}
                    item={item}
                    {...cardProps}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <p className="text-sm md:text-base text-center max-w-2xl">
          <span>
            * Kilogram bilgileri <b>±3 kg</b> arasında değişiklik gösterebilmektedir.
          </span>
          <span className="block mt-2">
            * Kapora ücreti <b>{new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(branding.deposit_amount)} TL</b>&apos;dir.
          </span>
        </p>
      </motion.div>
    </section>
  );
};

export default Prices;
