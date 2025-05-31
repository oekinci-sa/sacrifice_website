"use client";

import DesktopNavigation from "@/components/layout/header/desktop-navigation";
import Logo from "@/components/layout/header/logo";
import MobileNavigation from "@/components/layout/header/mobile-navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";

const Header = () => {
  const [open, setOpen] = useState(false);

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <header className="container flex items-center justify-between h-20 md:my-6 sticky top-0 z-50 bg-background">
      <Logo className="w-[200px] md:w-[250px]" />

      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <DesktopNavigation />
      </div>

      {/* Desktop Hemen Al Button */}
      <Button className="hidden md:flex bg-sac-primary text-white hover:bg-sac-primary/90 text-md">
        <Link href="/hisseal" className="flex items-center">
          Hemen al
        </Link>
      </Button>

      <MobileNavigation
        open={open}
        onOpenChange={setOpen}
        onLinkClick={handleLinkClick}
      />
    </header>
  );
};

export default Header;
