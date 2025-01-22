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
} from "lucide-react"
import { useSession } from "next-auth/react"
import { NavMain } from "./nav-main"
import { TeamSwitcher } from "./team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  teams: [
    {
      name: "Kurban Yönetim",
      logo: BarChart3,
      plan: "Admin",
    }
  ],
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
      title: "Kullanıcı Yönetimi",
      url: "/kurban-admin/kullanici-yonetimi",
      icon: UserCog,
      adminOnly: true,
    },
    {
      title: "Değişiklik Kayıtları",
      url: "/kurban-admin/degisiklik-kayitlari",
      icon: History,
    },
  ],
  projects: []
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "admin"

  const filteredNavMain = data.navMain.filter(item => !item.adminOnly || isAdmin)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
