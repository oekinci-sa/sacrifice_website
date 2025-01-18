"use client";

import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  Menu,
  Sun,
  Moon,
  LogOut,
  User,
  LayoutDashboard,
  Scissors,
  Users,
  CreditCard,
  UserCog,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const sidebarNavItems = [
  {
    title: "Genel Bakış",
    href: "/kurban-admin/genel-bakis",
    icon: LayoutDashboard,
    roles: ["admin", "editor"],
  },
  {
    title: "Kurbanlıklar",
    href: "/kurban-admin/kurbanliklar",
    icon: Scissors,
    roles: ["admin", "editor"],
  },
  {
    title: "Hissedarlar",
    href: "/kurban-admin/hissedarlar",
    icon: Users,
    roles: ["admin", "editor"],
  },
  {
    title: "Ödeme Analizi",
    href: "/kurban-admin/odeme-analizi",
    icon: CreditCard,
    roles: ["admin", "editor"],
  },
  {
    title: "Kullanıcı Yönetimi",
    href: "/kurban-admin/kullanici-yonetimi",
    icon: UserCog,
    roles: ["admin"],
  },
] as const;

interface AdminSidebarProps {
  isCollapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function AdminSidebar({ isCollapsed, onCollapsedChange }: AdminSidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();

  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    onCollapsedChange(newState);
    localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/giris" });
  };

  // Filter nav items based on user role
  const authorizedNavItems = sidebarNavItems.filter((item) =>
    item.roles.includes(session?.user?.role as string)
  );

  return (
    <div className={cn(
      "relative flex h-full flex-col bg-zinc-950 text-white transition-all duration-300",
      isCollapsed ? "w-[60px]" : "w-[240px]"
    )}>
      <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-4">
        {!isCollapsed && <h2 className="text-lg font-semibold">Admin Panel</h2>}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-900"
          onClick={toggleCollapsed}
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <nav className="space-y-1 px-2 py-4">
          {authorizedNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-2 rounded-lg px-3 py-2 text-zinc-400 transition-all hover:text-white hover:bg-zinc-900",
                pathname === item.href && "text-emerald-500 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-emerald-500 after:absolute after:left-0 after:top-0 after:h-full after:w-full after:bg-gradient-to-r after:from-emerald-500/20 after:to-transparent after:-z-10"
              )}
            >
              <item.icon className={cn("h-4 w-4", pathname === item.href && "text-emerald-500")} />
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-zinc-800 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-12 w-full justify-start gap-2 text-zinc-400 hover:text-white hover:bg-zinc-900">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image || ""} />
                <AvatarFallback>
                  {session?.user?.name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium">{session?.user?.name}</span>
                  <span className="text-xs text-zinc-500">{session?.user?.email}</span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? (
                <>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Açık Tema</span>
                </>
              ) : (
                <>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Koyu Tema</span>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Çıkış Yap</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 