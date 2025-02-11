"use client";

import Logo from "@/components/layout/Header/logo";
import Navigation from "@/components/layout/Header/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const Header = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <header className="container flex items-center justify-between mt-8">
      <Logo className="w-[200px] md:w-[250px]" />
      
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <Navigation />
      </div>
      
      <div className="flex justify-end gap-4 items-center">
        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-2 mt-8">
                <Link 
                  href="/" 
                  className={`p-2 hover:bg-accent rounded-md transition-colors ${pathname === "/" ? "text-sac-primary font-medium" : ""}`}
                  onClick={handleLinkClick}
                >
                  Anasayfa
                </Link>
                <Link 
                  href="/hakkimizda" 
                  className={`p-2 hover:bg-accent rounded-md transition-colors ${pathname === "/hakkimizda" ? "text-sac-primary font-medium" : ""}`}
                  onClick={handleLinkClick}
                >
                  Hakkımızda
                </Link>
                <Link 
                  href="/hisseal" 
                  className={`p-2 hover:bg-accent rounded-md transition-colors ${pathname === "/hisseal" ? "text-sac-primary font-medium" : ""}`}
                  onClick={handleLinkClick}
                >
                  Hisse Al
                </Link>
                <Link 
                  href="/hissesorgula" 
                  className={`p-2 hover:bg-accent rounded-md transition-colors ${pathname === "/hissesorgula" ? "text-sac-primary font-medium" : ""}`}
                  onClick={handleLinkClick}
                >
                  Hisse Sorgula
                </Link>
                <Link 
                  href="/yazilar" 
                  className={`p-2 hover:bg-accent rounded-md transition-colors ${pathname === "/yazilar" ? "text-sac-primary font-medium" : ""}`}
                  onClick={handleLinkClick}
                >
                  Yazılar
                </Link>
                <Link 
                  href="/iletisim" 
                  className={`p-2 hover:bg-accent rounded-md transition-colors ${pathname === "/iletisim" ? "text-sac-primary font-medium" : ""}`}
                  onClick={handleLinkClick}
                >
                  İletişim
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Desktop Button */}
        <Button className="hidden md:flex bg-sac-primary text-white hover:bg-sac-primary/90 text-md">
          <Link href="/hisseal">Hemen al</Link>
        </Button>
      </div>
    </header>
  );
};

export default Header;
