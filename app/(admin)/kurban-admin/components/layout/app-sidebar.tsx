"use client"

import * as React from "react"
import {
  Home,
  Users,
  Wallet,
  BarChart3,
  FileSpreadsheet,
  History,
  UserCog,
  LineChart,
  ChevronDown,
  ChevronRight,
  Menu,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useSidebarStore } from "@/stores/only-admin-pages/sidebar-store"
import { UserRole } from "@/types"

type NavItem = {
  id: string;
  title: string;
  url: string;
  icon: React.ElementType;
  items?: NavItem[];
  roles: Exclude<UserRole, null>[];
};

const navItems: NavItem[] = [
  {
    id: "general",
    title: "Genel Bakış",
    url: "/kurban-admin/genel-bakis",
    icon: Home,
    roles: ["admin", "editor"],
  },
  {
    id: "sacrifices",
    title: "Kurbanlıklar",
    url: "/kurban-admin/kurbanliklar",
    icon: Wallet,
    roles: ["admin", "editor"],
    items: [
      {
        id: "all-sacrifices",
        title: "Tüm Kurbanlıklar",
        url: "/kurban-admin/kurbanliklar/tum-kurbanliklar",
        icon: FileSpreadsheet,
        roles: ["admin", "editor"],
      },
    ],
  },
  {
    id: "shareholders",
    title: "Hissedarlar",
    url: "/kurban-admin/hissedarlar",
    icon: Users,
    roles: ["admin", "editor"],
    items: [
      {
        id: "all-shareholders",
        title: "Tüm Hissedarlar",
        url: "/kurban-admin/hissedarlar/tum-hissedarlar",
        icon: FileSpreadsheet,
        roles: ["admin", "editor"],
      },
    ],
  },
  {
    id: "payment-analysis",
    title: "Ödeme Analizi",
    url: "/kurban-admin/odeme-analizi",
    icon: LineChart,
    roles: ["admin", "editor"],
  },
  {
    id: "change-logs",
    title: "Değişiklik Kayıtları",
    url: "/kurban-admin/degisiklik-kayitlari",
    icon: History,
    roles: ["admin", "editor"],
  },
  {
    id: "user-management",
    title: "Kullanıcı Yönetimi",
    url: "/kurban-admin/kullanici-yonetimi",
    icon: UserCog,
    roles: ["admin"],
  },
];

export function AppSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const isAdmin = session?.user?.role === "admin"
  
  const { 
    isCollapsed, 
    toggleCollapsed, 
    isSubMenuOpen, 
    toggleSubMenu 
  } = useSidebarStore()

  const filteredNavItems = navItems.filter(item => 
    !item.roles || session?.user?.role && item.roles.includes(session.user.role as Exclude<UserRole, null>)
  )

  return (
    <div className={cn(
      "flex flex-col h-full border-r bg-background transition-all duration-300",
      isCollapsed ? "w-[60px]" : "w-[240px]"
    )}>
      {/* Sidebar Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {isCollapsed ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground mx-auto"
            onClick={toggleCollapsed}
          >
            <Menu className="h-5 w-5" />
          </Button>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 shrink-0" />
              <span className="text-lg font-semibold">Kurban Yönetim</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={toggleCollapsed}
            >
              <ChevronRight className={cn(
                "h-4 w-4 transition-transform rotate-180"
              )} />
            </Button>
          </>
        )}
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
            const hasSubItems = item.items && item.items.length > 0
            const isOpen = isSubMenuOpen(item.id)
            
            return (
              <div key={item.id} className="space-y-1">
                {/* Main menu item */}
                <div className="flex items-center">
                  <Link
                    href={item.url}
                    className={cn(
                      "flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-accent text-accent-foreground" 
                        : "hover:bg-accent/50 hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                  
                  {/* Dropdown toggle for submenus */}
                  {!isCollapsed && hasSubItems && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => toggleSubMenu(item.id)}
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                
                {/* Submenu items */}
                {!isCollapsed && hasSubItems && isOpen && (
                  <div className="ml-6 space-y-1">
                    {item.items?.map((subItem) => {
                      const isSubActive = pathname === subItem.url
                      
                      return (
                        <Link
                          key={subItem.id}
                          href={subItem.url}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isSubActive
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent/50 hover:text-accent-foreground"
                          )}
                        >
                          <subItem.icon className="h-4 w-4" />
                          <span>{subItem.title}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
