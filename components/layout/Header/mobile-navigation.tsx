"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { scrollToElement } from "@/utils/scrollToElement";

interface MobileNavigationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinkClick: () => void;
}

const MobileNavigation = ({ open, onOpenChange, onLinkClick }: MobileNavigationProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleScrollClick = async (elementId: string) => {
    onLinkClick(); // Menüyü kapat
    if (pathname !== '/') {
      await router.push('/');
      setTimeout(() => scrollToElement(elementId), 100);
    } else {
      scrollToElement(elementId);
    }
  };

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
          <nav className="flex flex-col gap-2 mt-8">
            <Link 
              href="/" 
              className={`p-2 hover:bg-accent text-sm rounded-md transition-colors ${pathname === "/" ? "text-sac-primary font-medium" : ""}`}
              onClick={onLinkClick}
            >
              Anasayfa
            </Link>
            <Link 
              href="#"
              className="p-2 hover:bg-accent text-sm rounded-md transition-colors text-left"
              onClick={(e) => {
                e.preventDefault();
                handleScrollClick('prices');
              }}
            >
              Hisse Bedelleri
            </Link>
            <Link 
              href="#"
              className="p-2 hover:bg-accent text-sm rounded-md transition-colors text-left"
              onClick={(e) => {
                e.preventDefault();
                handleScrollClick('process');
              }}
            >
              Süreç
            </Link>
            <Link 
              href="#"
              className="p-2 hover:bg-accent text-sm rounded-md transition-colors text-left"
              onClick={(e) => {
                e.preventDefault();
                handleScrollClick('faq');
              }}
            >
              S.S.S
            </Link>
            <Link 
              href="/hakkimizda" 
              className={`p-2 hover:bg-accent text-sm rounded-md transition-colors ${pathname === "/hakkimizda" ? "text-sac-primary font-medium" : ""}`}
              onClick={onLinkClick}
            >
              Hakkımızda
            </Link>
            <Link 
              href="/hisseal" 
              className={`p-2 hover:bg-accent text-sm rounded-md transition-colors ${pathname === "/hisseal" ? "text-sac-primary font-medium" : ""}`}
              onClick={onLinkClick}
            >
              Hisse Al
            </Link>
            <Link 
              href="/hissesorgula" 
              className={`p-2 hover:bg-accent text-sm rounded-md transition-colors ${pathname === "/hissesorgula" ? "text-sac-primary font-medium" : ""}`}
              onClick={onLinkClick}
            >
              Hisse Sorgula
            </Link>
            <Link 
              href="/yazilar" 
              className={`p-2 hover:bg-accent text-sm rounded-md transition-colors ${pathname === "/yazilar" ? "text-sac-primary font-medium" : ""}`}
              onClick={onLinkClick}
            >
              Yazılar
            </Link>
            <Link 
              href="/iletisim" 
              className={`p-2 hover:bg-accent text-sm rounded-md transition-colors ${pathname === "/iletisim" ? "text-sac-primary font-medium" : ""}`}
              onClick={onLinkClick}
            >
              İletişim
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileNavigation; 