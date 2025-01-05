"use client";
import Ayah from "@/app/(public)/(anasayfa)/components/ayah";
import Banner from "@/app/(public)/(anasayfa)/components/banner";
import Prices from "@/app/(public)/(anasayfa)/components/prices";
import Stats from "@/app/(public)/(anasayfa)/components/stats";
import Image from "next/image";
import Features from "./components/features";
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

export default function Home() {

  return (
    <div className="">
      <Ayah></Ayah>
      <Banner></Banner>
      <Features></Features>
      <Stats></Stats>
      <Prices></Prices>
    </div>
  );
}
