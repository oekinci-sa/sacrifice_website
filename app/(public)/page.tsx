"use client";
import Ayah from "@/app/(public)/(anasayfa)/components/Ayah";
import Banner from "@/app/(public)/(anasayfa)/components/Banner";
import Prices from "@/app/(public)/(anasayfa)/components/Prices";
import Stats from "@/app/(public)/(anasayfa)/components/Stats";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Çıkış sırasında bir hata oluştu:", error.message);
    } else {
      console.log("Başarıyla çıkış yapıldı.");
      router.push("/giris"); // Giriş sayfasına yönlendir
    }
  };
  return (
    <div className="py-24">
    <Button
      onClick={handleLogout}
      className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
    >
      Çıkış Yap
    </Button>
      <Ayah></Ayah>
      <Banner></Banner>
      <Stats></Stats>
      <Prices></Prices>
    </div>
  );
}
