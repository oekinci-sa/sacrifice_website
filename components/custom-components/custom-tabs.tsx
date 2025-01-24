"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CustomTabsProps {
  tabs: {
    value: string
    label: string
    content: React.ReactNode
  }[]
}

export function CustomTabs({ tabs }: CustomTabsProps) {
  return (
    <Tabs defaultValue={tabs[0].value} className="w-full">
      <TabsList className="w-fit justify-start rounded-none border-b bg-transparent p-0">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="pt-6">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
} 