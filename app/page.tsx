import Ayah from "@/app/(public)/(anasayfa)/components/Ayah";
import Banner from "@/app/(public)/(anasayfa)/components/Banner";
import Prices from "@/app/(public)/(anasayfa)/components/Prices";
import Stats from "@/app/(public)/(anasayfa)/components/Stats";

export default function Home() {
  return (
    <div className="py-24">
      <Ayah></Ayah>
      <Banner></Banner>
      <Stats></Stats>
      <Prices></Prices>
    </div>
  );
}
