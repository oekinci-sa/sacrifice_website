"use client";
import { useEffect, useState } from "react";
import Banner from "./components/banner";
import Faq from "./components/faq";
import Features from "./components/features";
import Prices from "./components/prices";
import Process from "./components/process";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronUp } from "lucide-react";

export default function Home() {
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Process komponenti yaklaşık olarak sayfanın yarısında olacağı için
      // window yüksekliğinin yarısını threshold olarak kullanıyoruz
      const threshold = window.innerHeight / 2;
      setShowScrollButton(window.scrollY > threshold);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col space-y-16 md:space-y-24 relative">
      {/* Pattern - Triangle (Sol üst) */}
      <div className="absolute -left-10 -top-50 -z-10 hidden md:block">
        <Image
          src="/patterns/pattern-triangle.svg"
          alt="Triangle Pattern"
          width={200}
          height={200}
          className="opacity-100"
        />
      </div>

      {/* Pattern - Spiral (Sağ üst) */}
      <div className="absolute -right-12 -top-14 -z-10 hidden md:block">
        <Image
          src="/patterns/pattern-spiral.svg"
          alt="Spiral Pattern"
          width={500}
          height={500}
          className="opacity-20"
        />
      </div>

      <Banner />
      <Features />
      <Prices />
      <Process />
      <Faq />

      {/* Scroll to Top Button */}
      {showScrollButton && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 rounded-lg bg-sac-primary hover:bg-sac-primary/90 p-0 shadow-lg"
          size="icon"
        >
          <ChevronUp className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}

// import { useRouter } from "next/navigation";
// import { supabase } from "@/utils/supabaseClient";
// import { Button } from "@/components/ui/button";
//   const router = useRouter();

//   const handleLogout = async () => {
//     const { error } = await supabase.auth.signOut();
//     if (error) {
//       console.error("Çıkış sırasında bir hata oluştu:", error.message);
//     } else {
//       console.log("Başarıyla çıkış yapıldı.");
//       router.push("/giris"); // Giriş sayfasına yönlendir
//     }
//   };

//   <Button
//     onClick={handleLogout}
//     className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
//   >
//     Çıkış Yap
//   </Button>;
