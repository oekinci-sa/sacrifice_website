"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import React, { useMemo } from "react";
import { AppSidebar } from "./components/layout/app-sidebar";

function UserNav() {
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({
      redirect: true,
      callbackUrl: "/giris"
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
            <AvatarFallback>{session?.user?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
          <p className="text-xs leading-none text-muted-foreground">
            {session?.user?.email}
          </p>
        </div>
        <Separator className="my-2" />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Çıkış yap</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DynamicBreadcrumb() {
  const pathname = usePathname();

  // Türkçe karakter düzeltmeleri için eşleştirme fonksiyonu
  const turkishCorrections = (text: string): string => {
    const corrections: Record<string, string> = {
      "kurban-admin": "Kurban Yönetimi",
      "genel-bakis": "Genel Bakış",
      "kurbanliklar": "Kurbanlıklar",
      "tum-kurbanliklar": "Tüm Kurbanlıklar",
      "hissedarlar": "Hissedarlar",
      "tum-hissedarlar": "Tüm Hissedarlar",
      "ayrintilar": "Ayrıntılar",
      "kullanici-yonetimi": "Kullanıcı Yönetimi",
      "degisiklik-kayitlari": "Değişiklik Kayıtları",
      "odeme-analizi": "Ödeme Analizi",
      "yazilar": "Yazılar",
      "iletisim": "İletişim"
    };

    // Eğer kelime düzeltme sözlüğünde varsa direkt olarak değiştirelim
    if (corrections[text]) {
      return corrections[text];
    }

    // Yoksa temel formatlama yapalım (boşluklar ve büyük harfler)
    return text
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const breadcrumbs = useMemo(() => {
    const paths = pathname.split('/').filter(Boolean);

    const pathItems = paths.map((path, index) => {
      // Türkçe karakter düzeltmeleri ile formatlama
      const formattedPath = turkishCorrections(path);

      const fullPath = `/${paths.slice(0, index + 1).join('/')}`;

      const isActive = index === paths.length - 1;

      return {
        name: formattedPath,
        path: fullPath,
        isActive,
      };
    });

    return pathItems;
  }, [pathname]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={item.path}>
            {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
            <BreadcrumbItem className="hidden md:block">
              {item.isActive ? (
                <BreadcrumbPage>{item.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.path}>{item.name}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <Separator orientation="vertical" className="mr-2 h-4" />
            <DynamicBreadcrumb />
          </div>
          <UserNav />
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 