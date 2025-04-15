"use client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { ChevronUp } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Ayah from "./components/ayah";
import Banner from "./components/banner";
import Faq from "./components/faq";
import Features from "./components/features";
import Prices from "./components/prices";
import Process from "./components/process";

// Yukarı kaydırma butonu için ayrı bir bileşen - React.memo ile sarmaladık
const ScrollToTopButton = React.memo(({ onClick }: { onClick: () => void }) => {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-8 right-8 w-12 h-12 rounded-lg bg-sac-primary hover:bg-sac-primary/90 p-0 shadow-lg z-50"
      size="icon"
      aria-label="Sayfanın başına dön"
    >
      <ChevronUp className="h-6 w-6" />
    </Button>
  );
});
ScrollToTopButton.displayName = 'ScrollToTopButton';

// Scroll olayını throttle etmek için yardımcı fonksiyon
function useThrottleScroll(callback: () => void, delay: number) {
  const lastRun = useRef(0);
  const timeout = useRef<NodeJS.Timeout>();

  return useCallback(() => {
    const now = Date.now();
    if (now - lastRun.current >= delay) {
      callback();
      lastRun.current = now;
    } else {
      clearTimeout(timeout.current);
      timeout.current = setTimeout(() => {
        callback();
        lastRun.current = Date.now();
      }, delay);
    }
  }, [callback, delay]);
}

// Mobil görünüm için ana bileşen
function MobileHome({ scrollToTop }: { scrollToTop: () => void }) {
  // Scroll butonu state'i ve ilgili mantık buraya taşındı
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Scroll durumunu kontrol eden callback - memoize edildi
  const checkScrollPosition = useCallback(() => {
    const threshold = window.innerHeight / 2;
    const shouldShow = window.scrollY > threshold;

    // Sadece değişim olduğunda state'i güncelle
    // Önceki state değerini kullanarak gereksiz güncellemeleri önle
    setShowScrollButton(prev => {
      if (prev !== shouldShow) {
        return shouldShow;
      }
      return prev;
    });
  }, []); // Bağımlılık kaldırıldı, çünkü artık dışarıdan showScrollButton gelmiyor

  // Throttle edilmiş scroll handler
  const throttledScrollHandler = useThrottleScroll(checkScrollPosition, 200);

  // Scroll olayını dinle
  useEffect(() => {
    window.addEventListener("scroll", throttledScrollHandler);
    // İlk render'da pozisyonu kontrol et
    checkScrollPosition();
    return () => window.removeEventListener("scroll", throttledScrollHandler);
  }, [throttledScrollHandler, checkScrollPosition]); // checkScrollPosition eklendi

  return (
    <div className="flex flex-col space-y-16 md:space-y-24 relative">
      <Ayah />
      <Banner />
      <Features />
      <Prices />
      <Process />
      <Faq />

      {showScrollButton && <ScrollToTopButton onClick={scrollToTop} />}
    </div>
  );
}

// Animasyonlu Tab Trigger bileşeni
const AnimatedTabTrigger = ({ value, children }: { value: string, children: React.ReactNode }) => {
  // Tab için animasyon ayarları
  const tabVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={tabVariants}
      className="inline-block"
    >
      <TabsTrigger
        value={value}
        className="px-4 py-2 bg-black/5 text-base text-black rounded-md transition-all duration-300 
          data-[state=active]:bg-sac-primary data-[state=active]:text-white data-[state=active]:font-medium data-[state=active]:text-lg hover:bg-black/10"
      >
        {children}
      </TabsTrigger>
    </motion.div>
  );
};

// Masaüstü görünüm için ana bileşen
function DesktopHome() {
  const [activeTab, setActiveTab] = useState("banner-features");
  const [isLoaded, setIsLoaded] = useState(false);

  // Sayfanın yüklenmesi tamamlandıktan sonra animasyonları başlat
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="relative">
      <Ayah />

      <Tabs
        defaultValue="banner-features"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full mt-16 mb-24"
      >
        {/* Tab butonları - Staggering animasyonlu yeni tasarım */}
        <div className="flex justify-center mb-16">
          <TabsList className="flex bg-transparent space-x-8 border-0 shadow-none p-0">
            {isLoaded && (
              <>
                <AnimatedTabTrigger value="banner-features"
                  // @ts-expect-error - Transition delay on first item
                  style={{ transitionDelay: '0.1s' }}
                >
                  Başlangıç
                </AnimatedTabTrigger>

                <AnimatedTabTrigger value="prices"
                  // @ts-expect-error - Transition delay on second item
                  style={{ transitionDelay: '0.2s' }}
                >
                  Hisse Bedellerimiz
                </AnimatedTabTrigger>

                <AnimatedTabTrigger value="process"
                  // @ts-expect-error - Transition delay on third item
                  style={{ transitionDelay: '0.3s' }}
                >
                  Hisse Alım Sürecimiz
                </AnimatedTabTrigger>

                <AnimatedTabTrigger value="faq"
                  // @ts-expect-error - Transition delay on fourth item
                  style={{ transitionDelay: '0.4s' }}
                >
                  Sıkça Sorulan Sorular
                </AnimatedTabTrigger>
              </>
            )}
          </TabsList>
        </div>

        <TabsContent value="banner-features" className="space-y-16 mt-6">
          <Banner />
          <Features />
        </TabsContent>

        <TabsContent value="prices" className="mt-6">
          <Prices />
        </TabsContent>

        <TabsContent value="process" className="mt-6">
          <Process />
        </TabsContent>

        <TabsContent value="faq" className="mt-6">
          <Faq />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Home() {
  // Sayfa başına scroll fonksiyonu - memoize edildi
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    // Responsive component wrapper kaldırıldı
    // Tailwind sınıfları ile koşullu render
    <>
      <div className="block md:hidden">
        <MobileHome scrollToTop={scrollToTop} />
      </div>
      <div className="hidden md:block">
        <DesktopHome />
      </div>
    </>
  );
}