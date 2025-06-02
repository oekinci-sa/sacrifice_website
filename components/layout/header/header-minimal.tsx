"use client";

import Logo from "@/components/layout/footer/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const HeaderMinimal = () => {

  return (
    <header className="container flex items-center justify-between h-20 md:my-6 sticky top-0 z-50 bg-background">
      <Logo className="w-[200px] md:w-[250px]" />

      {/* Desktop Hemen Al Button */}
      <Button className="bg-sac-primary text-white hover:bg-sac-primary/90 text-sm md:text-lg">
        <Link href="https://maps.app.goo.gl/yfA3h5mdS1uxAXTU9" target="_blank" className="flex items-center">
          Kesim Yeri
        </Link>
      </Button>

    </header>
  );
};

export default HeaderMinimal;
