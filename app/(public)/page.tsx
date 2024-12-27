import Contact from "@/components/public/common/contact";
import Ayah from "@/components/public/main/Ayah";
import Banner from "@/components/public/main/Banner";
import Prices from "@/components/public/main/Prices";
import Stats from "@/components/public/main/Stats";

export default function Home() {
  return (
    <div className="py-24">
      <Ayah></Ayah>
      <Banner></Banner>
      <Stats></Stats>
      <Prices></Prices>
      <Contact></Contact>
    </div>
  );
}
