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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/hooks/useUsers";
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";
import { LogOut, Pencil } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AdminIdleTimeout } from "./components/admin-idle-timeout";
import { AppSidebar } from "./components/layout/app-sidebar";
import { YearDropdown } from "./components/layout/year-dropdown";

// Type for shareholder data from API
interface ShareholderData {
  shareholder_id: string;
  shareholder_name: string;
  [key: string]: unknown;
}

function UserNav() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { data: dbUser, refetch: refetchUser } = useUser(session?.user?.id);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [saving, setSaving] = useState(false);

  const displayName = dbUser?.name || session?.user?.name || "";

  const openProfileDialog = useCallback(() => {
    setProfileName(displayName);
    setProfileOpen(true);
  }, [displayName]);

  const handleSaveProfile = useCallback(async () => {
    const userId = dbUser?.id || session?.user?.id;
    if (!userId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName.trim() }),
      });
      if (!res.ok) throw new Error("Güncelleme başarısız");
      refetchUser();
      window.dispatchEvent(new CustomEvent("user-updated"));
      toast({ title: "Profil güncellendi", description: "Adınız başarıyla değiştirildi." });
      setProfileOpen(false);
    } catch {
      toast({ title: "Hata", description: "Profil güncellenirken bir hata oluştu.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [dbUser?.id, session?.user?.id, profileName, refetchUser, toast]);

  const handleLogout = async () => {
    await signOut({
      redirect: true,
      callbackUrl: `${window.location.origin}/giris`,
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session?.user?.image || ""} alt={displayName} />
              <AvatarFallback>{displayName.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="flex flex-col space-y-1 p-2">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {session?.user?.email}
            </p>
          </div>
          <Separator className="my-2" />
          <DropdownMenuItem onClick={openProfileDialog}>
            <Pencil className="mr-2 h-4 w-4" />
            <span>Profili Düzenle</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Çıkış yap</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Profili Düzenle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="profile-name">Ad Soyad</Label>
              <Input
                id="profile-name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Adınız Soyadınız"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && profileName.trim()) handleSaveProfile();
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setProfileOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveProfile} disabled={saving || !profileName.trim()}>
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DynamicBreadcrumb() {
  const pathname = usePathname();
  const selectedYear = useAdminYearStore((s) => s.selectedYear);
  const [shareholderName, setShareholderName] = useState<string>("");
  const [isLoadingShareholder, setIsLoadingShareholder] = useState(false);

  // Türkçe karakter düzeltmeleri için eşleştirme fonksiyonu
  const turkishCorrections = (text: string): string => {
    const corrections: Record<string, string> = {
      "kurban-admin": "Kurban Yönetimi",
      "genel-bakis": "Genel Bakış",
      "kurbanliklar": "Kurbanlıklar",
      "tum-kurbanliklar": "Kurbanlıklar",
      "hissedarlar": "Hissedarlar",
      "tum-hissedarlar": "Hissedarlar",
      "ayrintilar": "Ayrıntılar",
      "kullanici-yonetimi": "Kullanıcı Yönetimi",
      "degisiklik-kayitlari": "Değişiklik Kayıtları",
      "odeme-analizi": "Ödeme Analizi",
      "yazilar": "Yazılar",
      "iletisim": "İletişim",
      "iletisim-mesajlari": "İletişim Mesajları",
      "reminder-talepleri": "Bana Haber Ver Talepleri",
      "mail-islemleri": "Mail İşlemleri",
      "rezervasyonlar": "Rezervasyonlar",
      "uyumsuz-hisseler": "Uyumsuzluklar",
      "odemeler": "Ödemeler",
      "teslimatlar": "Teslimatlar"
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

    // Hissedar detay sayfası kontrolü: /kurban-admin/hissedarlar/ayrintilar/[id]
    if (paths.length === 4 &&
      paths[0] === 'kurban-admin' &&
      paths[1] === 'hissedarlar' &&
      paths[2] === 'ayrintilar') {
      const shareholderId = paths[3];

      setIsLoadingShareholder(true);
      setShareholderName(""); // Reset previous value

      // Shareholder API çağrısı - tüm hissedarları al ve ID ile eşleştir
      const url = selectedYear != null
        ? `/api/get-shareholders?year=${selectedYear}`
        : '/api/get-shareholders';
      fetch(url)
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
    if (!(paths.length === 4 && paths[0] === 'kurban-admin' && paths[1] === 'hissedarlar' && paths[2] === 'ayrintilar')) {
      setShareholderName("");
      setIsLoadingShareholder(false);
    }
  }, [pathname, selectedYear]);

  const breadcrumbs = useMemo(() => {
    const paths = pathname.split('/').filter(Boolean);

    const pathItems = paths.map((path, index) => {
      let formattedPath = turkishCorrections(path);
      let shouldShowItem = true;

      // Son path elementi ise (detay sayfası), özel isim kullan
      if (index === paths.length - 1) {
        // Hissedar detay sayfası için shareholder_name kullan
        if (paths.length === 4 &&
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
  }, [pathname, shareholderName, isLoadingShareholder]);

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
    <div className="flex h-screen admin-neutral-theme">
      <AdminIdleTimeout />
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-2 sm:px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Separator orientation="vertical" className="mr-2 hidden h-4 sm:block" />
            <DynamicBreadcrumb />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <YearDropdown />
            <UserNav />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 