"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { usePendingUserCount } from "@/hooks/usePendingUserCount"
import { useTenantBranding } from "@/hooks/useTenantBranding"
import { useUnacknowledgedMismatchesCount } from "@/hooks/useUnacknowledgedMismatchesCount"
import { useUncontactedShareholdersCount } from "@/hooks/useUncontactedShareholdersCount"
import { useUnreadContactMessagesCount } from "@/hooks/useUnreadContactMessagesCount"
import { logReservationRealtime } from "@/lib/debug-reservation-realtime"
import { cn } from "@/lib/utils"
import { useSidebarStore } from "@/stores/only-admin-pages/sidebar-store"
import { useActiveReservationsCountStore } from "@/stores/only-admin-pages/useActiveReservationsCountStore"
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore"
import { UserRole } from "@/types"
import {
  AlertTriangle,
  Bell,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  History,
  Home,
  Mail,
  MessageSquare,
  PanelLeft,
  Receipt,
  Settings,
  Truck,
  UserCog
} from "lucide-react"
import { useSession } from "next-auth/react"
import Image from "next/image"
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

const mainNavItems: NavItem[] = [
  { id: "general", title: "Genel Bakış", url: "/kurban-admin/genel-bakis", icon: Home, roles: ["admin", "editor", "super_admin"] },
  { id: "all-sacrifices", title: "Kurbanlıklar", url: "/kurban-admin/kurbanliklar/tum-kurbanliklar", icon: FileSpreadsheet, roles: ["admin", "editor", "super_admin"] },
  { id: "all-shareholders", title: "Hissedarlar", url: "/kurban-admin/hissedarlar/tum-hissedarlar", icon: FileSpreadsheet, roles: ["admin", "editor", "super_admin"] },
  { id: "payments", title: "Ödemeler", url: "/kurban-admin/hissedarlar/odemeler", icon: Receipt, roles: ["admin", "editor", "super_admin"] },
  { id: "teslimatlar", title: "Teslimatlar", url: "/kurban-admin/teslimatlar", icon: Truck, roles: ["admin", "editor", "super_admin"] },
  { id: "change-logs", title: "Değişiklik Kayıtları", url: "/kurban-admin/degisiklik-kayitlari", icon: History, roles: ["admin", "editor", "super_admin"] },
  { id: "mismatched-shares", title: "Uyumsuzluklar", url: "/kurban-admin/uyumsuz-hisseler", icon: AlertTriangle, roles: ["admin", "editor", "super_admin"] },
  { id: "reservations", title: "Rezervasyonlar", url: "/kurban-admin/rezervasyonlar", icon: Receipt, roles: ["admin", "editor", "super_admin"] },
  { id: "contact-messages", title: "İletişim Mesajları", url: "/kurban-admin/iletisim-mesajlari", icon: MessageSquare, roles: ["admin", "editor", "super_admin"] },
  { id: "reminder-requests", title: "Bana Haber Ver Talepleri", url: "/kurban-admin/reminder-talepleri", icon: Bell, roles: ["admin", "editor", "super_admin"] },
  { id: "mail-operations", title: "Mail İşlemleri", url: "/kurban-admin/mail-islemleri", icon: Mail, roles: ["admin", "editor", "super_admin"] },
];

const bottomNavItems: NavItem[] = [
  { id: "tenant-settings", title: "Organizasyon Ayarları", url: "/kurban-admin/tenant-ayarlari", icon: Settings, roles: ["super_admin"] },
  { id: "user-management", title: "Kullanıcı Yönetimi", url: "/kurban-admin/kullanici-yonetimi", icon: UserCog, roles: ["admin", "super_admin"] },
];

const separatorAfterIds = ["all-shareholders", "teslimatlar", "reservations"];

export function AppSidebar() {
  const { data: session } = useSession()
  const { logo_slug: logoSlug } = useTenantBranding()
  const pathname = usePathname()
  const selectedYear = useAdminYearStore((s) => s.selectedYear)
  const { count: unreadContactCount, isLoading: unreadContactLoading } = useUnreadContactMessagesCount(selectedYear)
  const { count: uncontactedShareholdersCount, isLoading: uncontactedLoading } = useUncontactedShareholdersCount(selectedYear)
  const { count: pendingUserCount, isLoading: pendingUserLoading } = usePendingUserCount()
  const { count: unacknowledgedMismatchesCount, isLoading: mismatchesLoading } = useUnacknowledgedMismatchesCount(selectedYear)
  const activeReservationsCount = useActiveReservationsCountStore((s) => s.count)
  const activeReservationsLoading = useActiveReservationsCountStore((s) => s.isLoading)
  const fetchActiveReservationsCount = useActiveReservationsCountStore((s) => s.fetchCount)

  React.useEffect(() => {
    logReservationRealtime("[SIDEBAR] fetchCount tetiklendi (selectedYear değişti):", selectedYear)
    fetchActiveReservationsCount(selectedYear)
  }, [fetchActiveReservationsCount, selectedYear])

  // Rezervasyonlar sayfasına girildiğinde badge'i yeniden çek (realtime bazen tetiklenmeyebilir)
  React.useEffect(() => {
    if (pathname.startsWith("/kurban-admin/rezervasyonlar") && selectedYear != null) {
      logReservationRealtime("[SIDEBAR] Rezervasyonlar sayfasına girildi, fetchCount tetikleniyor")
      fetchActiveReservationsCount(selectedYear)
    }
  }, [pathname, selectedYear, fetchActiveReservationsCount])

  React.useEffect(() => {
    const handler = () => {
      logReservationRealtime("[SIDEBAR] reservation-updated event, fetchCount tetikleniyor")
      fetchActiveReservationsCount(selectedYear)
    }
    window.addEventListener("reservation-updated", handler)
    return () => window.removeEventListener("reservation-updated", handler)
  }, [fetchActiveReservationsCount, selectedYear])

  const {
    isCollapsed,
    toggleCollapsed,
    isSubMenuOpen,
    toggleSubMenu
  } = useSidebarStore()

  // Badge rengi: tenant teması (yeşil/mavi)
  const badgeColorClass = "admin-tenant-accent bg-primary text-primary-foreground";

  const filteredMainItems = mainNavItems.filter(item =>
    !item.roles || (session?.user?.role && item.roles.includes(session.user.role as Exclude<UserRole, null>))
  )
  const filteredBottomItems = bottomNavItems.filter(item =>
    !item.roles || (session?.user?.role && item.roles.includes(session.user.role as Exclude<UserRole, null>))
  )

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
    const hasSubItems = item.items && item.items.length > 0
    const isOpen = isSubMenuOpen(item.id)
    const showUnreadBadge = item.id === "contact-messages" && !unreadContactLoading && unreadContactCount > 0 && !isCollapsed
    const showShareholdersBadge = item.id === "all-shareholders" && !uncontactedLoading && uncontactedShareholdersCount > 0 && !isCollapsed
    const showPendingUserBadge = item.id === "user-management" && !pendingUserLoading && pendingUserCount > 0 && !isCollapsed
    const showMismatchesBadge = item.id === "mismatched-shares" && !mismatchesLoading && unacknowledgedMismatchesCount > 0 && !isCollapsed
    const showActiveReservationsBadge = item.id === "reservations" && !activeReservationsLoading && activeReservationsCount > 0 && !isCollapsed
    const badgeCount = showUnreadBadge ? unreadContactCount : showShareholdersBadge ? uncontactedShareholdersCount : showPendingUserBadge ? pendingUserCount : showMismatchesBadge ? unacknowledgedMismatchesCount : showActiveReservationsBadge ? activeReservationsCount : 0
    const showBadge = showUnreadBadge || showShareholdersBadge || showPendingUserBadge || showMismatchesBadge || showActiveReservationsBadge

    return (
      <div key={item.id} className="space-y-1">
        <div className="flex items-center">
          <Link
            href={item.url}
            className={cn(
              "flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "bg-muted text-foreground" : "hover:bg-muted/80 hover:text-foreground text-muted-foreground"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span className="min-w-0 truncate">{item.title}</span>}
            {showBadge && (
              <span className={cn("ml-auto shrink-0 min-w-0 h-5 flex items-center justify-center rounded-full text-xs font-semibold px-1.5 tabular-nums", badgeColorClass)}>
                {badgeCount.toLocaleString("tr-TR")}
              </span>
            )}
          </Link>
          {!isCollapsed && hasSubItems && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => toggleSubMenu(item.id)}>
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          )}
        </div>
        {!isCollapsed && hasSubItems && isOpen && (
          <div className="ml-6 space-y-1">
            {item.items?.map((subItem) => (
              <Link
                key={subItem.id}
                href={subItem.url}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === subItem.url ? "bg-muted text-foreground" : "hover:bg-muted/80 hover:text-foreground text-muted-foreground"
                )}
              >
                <subItem.icon className="h-4 w-4" />
                <span>{subItem.title}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn(
      "flex flex-col h-full border-r bg-background transition-all duration-300",
      isCollapsed ? "w-[60px]" : "w-[240px]"
    )}>
      {/* Sidebar Header */}
      <div className="flex h-16 items-center justify-between gap-2 border-b px-2 sm:px-3">
        {isCollapsed ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground mx-auto"
            onClick={toggleCollapsed}
            aria-label="Kenar çubuğunu aç"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        ) : (
          <>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              title="Ana sayfayı yeni sekmede aç"
              className={
                logoSlug === "elya-hayvancilik"
                  ? "relative block h-9 w-[100px] min-w-0 shrink"
                  : "relative block h-[60px] w-[min(210px,calc(100%-2.75rem))] min-w-0 shrink"
              }
            >
              <Image
                src={`/logos/${logoSlug}/${logoSlug}.svg`}
                alt="Ana sayfa — organizasyon logosu"
                fill
                className="object-contain object-left"
                sizes={logoSlug === "elya-hayvancilik" ? "100px" : "240px"}
                priority
              />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground"
              onClick={toggleCollapsed}
              aria-label="Kenar çubuğunu daralt"
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 flex flex-col overflow-hidden py-4">
        <nav className="flex-1 overflow-y-auto space-y-1 px-2">
          {filteredMainItems.map((item) => (
            <React.Fragment key={item.id}>
              {renderNavItem(item)}
              {separatorAfterIds.includes(item.id) && !isCollapsed && (
                <div className="py-2 flex items-center" aria-hidden>
                  <Separator className="w-full" />
                </div>
              )}
            </React.Fragment>
          ))}
        </nav>
        {filteredBottomItems.length > 0 && (
          <>
            <div className={cn("flex items-center", !isCollapsed ? "py-3" : "py-2")} aria-hidden>
              <Separator className="w-full" />
            </div>
            <nav className="flex-shrink-0 space-y-1 px-2">
              {filteredBottomItems.map((item) => renderNavItem(item))}
            </nav>
          </>
        )}
      </div>
    </div>
  )
}
