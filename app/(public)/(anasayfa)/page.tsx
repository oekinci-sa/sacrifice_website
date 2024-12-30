"use client";
import Ayah from "@/app/(public)/(anasayfa)/components/Ayah";
import Banner from "@/app/(public)/(anasayfa)/components/Banner";
import Prices from "@/app/(public)/(anasayfa)/components/Prices";
import Stats from "@/app/(public)/(anasayfa)/components/Stats";
import Image from "next/image";
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
    <div className="py-24">
      <Ayah></Ayah>
      <Banner></Banner>
      <Image
        src="/home-page-cow.jpg"
        alt="cow"
        className="container mx-auto m-16 rounded-md"
        width={800}
        height={300}
      ></Image>

      <Stats></Stats>
      <Prices></Prices>
    </div>
  );
}
