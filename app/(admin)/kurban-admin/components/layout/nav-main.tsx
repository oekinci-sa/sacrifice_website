"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronRight, LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  items?: NavItem[]
}

interface NavMainProps {
  items: NavItem[]
}

export function NavMain({ items }: NavMainProps) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <SidebarGroup className="mt-8">
      <SidebarMenu className="flex flex-col gap-4">
        {items.map((item) => {
          const isActive = pathname === item.url
          const hasSubItems = item.items && item.items.length > 0

          return (
            <SidebarMenuItem key={item.title}>
              {hasSubItems ? (
                <Collapsible defaultOpen={pathname.startsWith(item.url)}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton 
                      className="group hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                    >
                      <div className="flex-1 flex items-center gap-2" onClick={() => router.push(item.url)}>
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span className="text-base font-medium">{item.title}</span>
                      </div>
                      <ChevronRight className="ml-auto h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="pl-10 mt-4 flex flex-col gap-4">
                      {item.items?.map((subItem) => (
                        <SidebarMenuItem key={subItem.title}>
                          <SidebarMenuButton 
                            asChild
                            className="hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                          >
                            <Link href={subItem.url}>
                              <div className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                              <span className="text-sm">{subItem.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <SidebarMenuButton 
                  asChild
                  className="hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                >
                  <Link href={item.url} className="flex items-center gap-2">
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="text-base font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
