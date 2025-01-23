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
} from "lucide-react"
import { useSession } from "next-auth/react"
import { NavMain } from "./nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Genel Bakış",
      url: "/kurban-admin/genel-bakis",
      icon: Home,
      isActive: true,
    },
    {
      title: "Kurbanlıklar",
      url: "/kurban-admin/kurbanliklar",
      icon: Wallet,
      items: [
        {
          title: "Tüm Kurbanlıklar",
          url: "/kurban-admin/kurbanliklar/tum-kurbanliklar",
          icon: FileSpreadsheet,
        },
      ],
    },
    {
      title: "Hissedarlar",
      url: "/kurban-admin/hissedarlar",
      icon: Users,
      items: [
        {
          title: "Tüm Hissedarlar",
          url: "/kurban-admin/hissedarlar/tum-hissedarlar",
          icon: FileSpreadsheet,
        },
      ],
    },
    {
      title: "Ödeme Analizi",
      url: "/kurban-admin/odeme-analizi",
      icon: LineChart,
    },
    {
      title: "Değişiklik Kayıtları",
      url: "/kurban-admin/degisiklik-kayitlari",
      icon: History,
    },
    {
      title: "Kullanıcı Yönetimi",
      url: "/kurban-admin/kullanici-yonetimi",
      icon: UserCog,
      adminOnly: true,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "admin"
  const { state } = useSidebar()
  const [subMenusOpen, setSubMenusOpen] = React.useState(true)

  const filteredNavMain = data.navMain.filter(item => !item.adminOnly || isAdmin)

  React.useEffect(() => {
    if (state === "collapsed") {
      setSubMenusOpen(false)
    }
  }, [state])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <BarChart3 className="h-6 w-6 shrink-0" />
          {state === "expanded" && <span className="text-lg font-semibold">Kurban Yönetim</span>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} subMenusOpen={subMenusOpen} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
