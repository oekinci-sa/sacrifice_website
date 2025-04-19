"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import EmptySharesBadge from "@/components/common/empty-shares-badge";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MobileNavigationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinkClick: () => void;
}

const MobileNavigation = ({ open, onOpenChange, onLinkClick }: MobileNavigationProps) => {
  const pathname = usePathname();

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
              href="/hakkimizda" 
              className={`p-2 hover:bg-accent text-sm rounded-md transition-colors ${pathname === "/hakkimizda" ? "text-sac-primary font-medium" : ""}`}
              onClick={onLinkClick}
            >
              Hakkımızda
            </Link>
            <div className="flex items-center">
              <Link 
                href="/hisseal" 
                className={`p-2 hover:bg-accent text-sm rounded-md transition-colors flex-grow ${pathname === "/hisseal" ? "text-sac-primary font-medium" : ""}`}
                onClick={onLinkClick}
              >
                Hisse Al
                <EmptySharesBadge size="sm" className="ml-1 inline-block" />
              </Link>
            </div>
            <Link 
              href="/hissesorgula" 
              className={`p-2 hover:bg-accent text-sm rounded-md transition-colors ${pathname === "/hissesorgula" ? "text-sac-primary font-medium" : ""}`}
              onClick={onLinkClick}
            >
              Hisse Sorgula
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