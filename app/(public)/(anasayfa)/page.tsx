"use client";
import Ayah from "./components/ayah";
import Banner from "./components/banner";
import Faq from "./components/faq";
import Features from "./components/features";
import Prices from "./components/prices";
import Process from "./components/process";

export default function Home() {

  return (
    <div className="flex flex-col space-y-20">
      <Ayah></Ayah>
      <Banner></Banner>
      <Features></Features>
      <Prices></Prices>
      <Process></Process>
      <Faq></Faq>
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
