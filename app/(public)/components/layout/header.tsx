"use client";

import DesktopNavigation from "@/components/layout/Header/desktop-navigation";
import Logo from "@/components/layout/Header/logo";
import MobileNavigation from "@/components/layout/Header/mobile-navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";

const Header = () => {
  const [open, setOpen] = useState(false);

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <header className="pt-4 sticky top-0 z-50 w-full bg-background">
      <div className="container flex items-center justify-between h-20">
        <Logo className="w-[200px] md:w-[250px]" />

        {/* Desktop Navigation */}
        <div className="hidden md:block">
          <DesktopNavigation />
        </div>

        <div className="flex justify-end gap-4 items-center">
          <MobileNavigation
            open={open}
            onOpenChange={setOpen}
            onLinkClick={handleLinkClick}
          />

          {/* Desktop Button */}
          <Button className="hidden md:flex bg-sac-primary text-white hover:bg-sac-primary/90 text-md">
            <Link href="/hisseal" className="flex items-center">
              Hemen al
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
