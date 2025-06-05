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
import React, { useEffect, useMemo, useState } from "react";
import { AppSidebar } from "./components/layout/app-sidebar";

// Type for shareholder data from API
interface ShareholderData {
  shareholder_id: string;
  shareholder_name: string;
  [key: string]: unknown;
}

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
  const [sacrificeNo, setSacrificeNo] = useState<string>("");
  const [shareholderName, setShareholderName] = useState<string>("");
  const [isLoadingSacrifice, setIsLoadingSacrifice] = useState(false);
  const [isLoadingShareholder, setIsLoadingShareholder] = useState(false);

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

  // API çağrıları ile sacrifice_no ve shareholder_name'i al
  useEffect(() => {
    const paths = pathname.split('/').filter(Boolean);

    // Kurban detay sayfası kontrolü: /kurban-admin/kurbanliklar/ayrintilar/[id]
    if (paths.length === 4 &&
      paths[0] === 'kurban-admin' &&
      paths[1] === 'kurbanliklar' &&
      paths[2] === 'ayrintilar') {
      const sacrificeId = paths[3];

      setIsLoadingSacrifice(true);
      setSacrificeNo(""); // Reset previous value

      // Sacrifice API çağrısı
      fetch(`/api/get-sacrifice-by-id?id=${sacrificeId}`)
        .then(response => response.json())
        .then(data => {
          if (data.sacrifice_no) {
            setSacrificeNo(data.sacrifice_no);
          }
        })
        .catch(error => {
          console.error('Error fetching sacrifice data:', error);
        })
        .finally(() => {
          setIsLoadingSacrifice(false);
        });
    }

    // Hissedar detay sayfası kontrolü: /kurban-admin/hissedarlar/ayrintilar/[id]
    if (paths.length === 4 &&
      paths[0] === 'kurban-admin' &&
      paths[1] === 'hissedarlar' &&
      paths[2] === 'ayrintilar') {
      const shareholderId = paths[3];

      setIsLoadingShareholder(true);
      setShareholderName(""); // Reset previous value

      // Shareholder API çağrısı - tüm hissedarları al ve ID ile eşleştir
      fetch('/api/get-shareholders')
        .then(response => response.json())
        .then(data => {
          if (data.shareholders) {
            const shareholder = data.shareholders.find((s: ShareholderData) => s.shareholder_id === shareholderId);
            if (shareholder && shareholder.shareholder_name) {
              setShareholderName(shareholder.shareholder_name);
            }
          }
        })
        .catch(error => {
          console.error('Error fetching shareholder data:', error);
        })
        .finally(() => {
          setIsLoadingShareholder(false);
        });
    }

    // Diğer sayfalarda state'i temizle
    if (!(paths.length === 4 && paths[0] === 'kurban-admin' && paths[2] === 'ayrintilar')) {
      setSacrificeNo("");
      setShareholderName("");
      setIsLoadingSacrifice(false);
      setIsLoadingShareholder(false);
    }
  }, [pathname]);

  const breadcrumbs = useMemo(() => {
    const paths = pathname.split('/').filter(Boolean);

    const pathItems = paths.map((path, index) => {
      let formattedPath = turkishCorrections(path);
      let shouldShowItem = true;

      // Son path elementi ise (detay sayfası), özel isim kullan
      if (index === paths.length - 1) {
        // Kurban detay sayfası için sacrifice_no kullan
        if (paths.length === 4 &&
          paths[0] === 'kurban-admin' &&
          paths[1] === 'kurbanliklar' &&
          paths[2] === 'ayrintilar') {
          if (isLoadingSacrifice) {
            shouldShowItem = false; // Loading sırasında gösterme
          } else if (sacrificeNo) {
            formattedPath = sacrificeNo;
          } else {
            shouldShowItem = false; // Veri yoksa gösterme
          }
        }
        // Hissedar detay sayfası için shareholder_name kullan
        else if (paths.length === 4 &&
          paths[0] === 'kurban-admin' &&
          paths[1] === 'hissedarlar' &&
          paths[2] === 'ayrintilar') {
          if (isLoadingShareholder) {
            shouldShowItem = false; // Loading sırasında gösterme
          } else if (shareholderName) {
            formattedPath = shareholderName;
          } else {
            shouldShowItem = false; // Veri yoksa gösterme
          }
        }
      }

      const fullPath = `/${paths.slice(0, index + 1).join('/')}`;
      const isActive = index === paths.length - 1;

      return {
        name: formattedPath,
        path: fullPath,
        isActive,
        shouldShow: shouldShowItem,
      };
    });

    return pathItems;
  }, [pathname, sacrificeNo, shareholderName, isLoadingSacrifice, isLoadingShareholder]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs
          .filter(item => item.shouldShow)
          .map((item, index) => (
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