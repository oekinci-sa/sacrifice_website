"use client"

import { Button } from "@/components/ui/button"
import { usePendingUserCount } from "@/hooks/usePendingUserCount"
import { useUnacknowledgedMismatchesCount } from "@/hooks/useUnacknowledgedMismatchesCount"
import { useUncontactedShareholdersCount } from "@/hooks/useUncontactedShareholdersCount"
import { useUnreadContactMessagesCount } from "@/hooks/useUnreadContactMessagesCount"
import { cn } from "@/lib/utils"
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore"
import { useSidebarStore } from "@/stores/only-admin-pages/sidebar-store"
import { UserRole } from "@/types"
import {
  AlertTriangle,
  BarChart3,
  Bell,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  History,
  Home,
  Menu,
  MessageSquare,
  Receipt,
  UserCog
} from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

type NavItem = {
  id: string;
  title: string;
  url: string;
  icon: React.ElementType;
  items?: NavItem[];
  roles: Exclude<UserRole, null>[];
};

const GOLBASI_TENANT_ID = "00000000-0000-0000-0000-000000000003";
const KAHRAMANKAZAN_TENANT_ID = "00000000-0000-0000-0000-000000000002";

const navItems: NavItem[] = [
  {
    id: "general",
    title: "Genel Bakış",
    url: "/kurban-admin/genel-bakis",
    icon: Home,
    roles: ["admin", "editor", "super_admin"],
  },
  {
    id: "all-sacrifices",
    title: "Kurbanlıklar",
    url: "/kurban-admin/kurbanliklar/tum-kurbanliklar",
    icon: FileSpreadsheet,
    roles: ["admin", "editor", "super_admin"],
  },
  {
    id: "all-shareholders",
    title: "Hissedarlar",
    url: "/kurban-admin/hissedarlar/tum-hissedarlar",
    icon: FileSpreadsheet,
    roles: ["admin", "editor", "super_admin"],
  },
  {
    id: "payments",
    title: "Ödemeler",
    url: "/kurban-admin/hissedarlar/odemeler",
    icon: Receipt,
    roles: ["admin", "editor", "super_admin"],
  },
  {
    id: "change-logs",
    title: "Değişiklik Kayıtları",
    url: "/kurban-admin/degisiklik-kayitlari",
    icon: History,
    roles: ["admin", "editor", "super_admin"],
  },
  {
    id: "mismatched-shares",
    title: "Uyumsuzluklar",
    url: "/kurban-admin/uyumsuz-hisseler",
    icon: AlertTriangle,
    roles: ["admin", "editor", "super_admin"],
  },
  {
    id: "reservations",
    title: "Rezervasyonlar",
    url: "/kurban-admin/rezervasyonlar",
    icon: Receipt,
    roles: ["super_admin"],
  },
  {
    id: "contact-messages",
    title: "İletişim Mesajları",
    url: "/kurban-admin/iletisim-mesajlari",
    icon: MessageSquare,
    roles: ["admin", "editor", "super_admin"],
  },
  {
    id: "reminder-requests",
    title: "Bana Haber Ver Talepleri",
    url: "/kurban-admin/reminder-talepleri",
    icon: Bell,
    roles: ["admin", "editor", "super_admin"],
  },
  {
    id: "user-management",
    title: "Kullanıcı Yönetimi",
    url: "/kurban-admin/kullanici-yonetimi",
    icon: UserCog,
    roles: ["admin", "super_admin"],
  },
];

export function AppSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const selectedYear = useAdminYearStore((s) => s.selectedYear)
  const { count: unreadContactCount, isLoading: unreadContactLoading } = useUnreadContactMessagesCount()
  const { count: uncontactedShareholdersCount, isLoading: uncontactedLoading } = useUncontactedShareholdersCount(selectedYear)
  const { count: pendingUserCount, isLoading: pendingUserLoading } = usePendingUserCount()
  const { count: unacknowledgedMismatchesCount, isLoading: mismatchesLoading } = useUnacknowledgedMismatchesCount()

  const {
    isCollapsed,
    toggleCollapsed,
    isSubMenuOpen,
    toggleSubMenu
  } = useSidebarStore()

  const tenantId = session?.tenant_id;
  const isGolbasi = tenantId === GOLBASI_TENANT_ID;
  const isKahramankazan = tenantId === KAHRAMANKAZAN_TENANT_ID;
  const badgeColorClass =
    isGolbasi
      ? "bg-sac-blue text-white"
      : isKahramankazan
        ? "bg-sac-graph-green-tone-light text-white"
        : "bg-sac-blue text-white";

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
            const showUnreadBadge = item.id === "contact-messages" && !unreadContactLoading && unreadContactCount > 0 && !isCollapsed
            const showShareholdersBadge = item.id === "all-shareholders" && !uncontactedLoading && uncontactedShareholdersCount > 0 && !isCollapsed
            const showPendingUserBadge = item.id === "user-management" && !pendingUserLoading && pendingUserCount > 0 && !isCollapsed
            const showMismatchesBadge = item.id === "mismatched-shares" && !mismatchesLoading && unacknowledgedMismatchesCount > 0 && !isCollapsed

            const badgeCount = showUnreadBadge ? unreadContactCount : showShareholdersBadge ? uncontactedShareholdersCount : showPendingUserBadge ? pendingUserCount : showMismatchesBadge ? unacknowledgedMismatchesCount : 0
            const showBadge = showUnreadBadge || showShareholdersBadge || showPendingUserBadge || showMismatchesBadge

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
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span className="min-w-0 truncate">{item.title}</span>}
                    {showBadge && (
                      <span className={cn("ml-auto shrink-0 min-w-[1.25rem] h-5 flex items-center justify-center rounded-full text-xs font-semibold px-1.5", badgeColorClass)}>
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}
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
