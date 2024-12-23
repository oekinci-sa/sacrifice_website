import Contact from "@/components/common/Contact";
import Ayah from "@/components/main/Ayah";
import Banner from "@/components/main/Banner";
import Prices from "@/components/main/Prices";
import Stats from "@/components/main/Stats";

export default function Home() {
  return (
    <div>
      <Ayah></Ayah>
      <Banner></Banner>
      <Stats></Stats>
      <Prices></Prices>
      <Contact></Contact>
    </div>
  );
}
