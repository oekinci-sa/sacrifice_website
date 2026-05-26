"use client";

import Logo from "@/components/layout/header/logo";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const MAPS_LINKS: Record<string, string> = {
  "elya-hayvancilik": "https://maps.app.goo.gl/6Uosc3XLkES5tw6x7",
  "ankara-kurban": "https://maps.app.goo.gl/yfA3h5mdS1uxAXTU9",
};

const HeaderMinimal = () => {
  const branding = useTenantBranding();
  const mapsHref = MAPS_LINKS[branding.logo_slug] ?? MAPS_LINKS["ankara-kurban"];

  return (
    <header className="container flex items-center justify-between h-20 md:my-6 sticky top-0 z-50 bg-background">
      <Logo className="w-[200px] md:w-[250px]" />

      <Button
        asChild
        className="h-10 md:h-12 px-3 md:px-4 text-base md:text-lg font-semibold bg-red-600 text-white hover:bg-red-700"
      >
        <Link href={mapsHref} target="_blank" rel="noopener noreferrer">
          Kesim Yeri Konumu
        </Link>
      </Button>

    </header>
  );
};

export default HeaderMinimal;
