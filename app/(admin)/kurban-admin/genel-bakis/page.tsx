"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore";
import { SummaryCards } from "./components/summary-cards";
import { SummaryGraphs } from "./components/summary-graphs";

export default function GenelBakisPage() {
  // Get data from Zustand stores to check if loaded
  const { sacrifices } = useSacrificeStore();
  const { shareholders } = useShareholderStore();
  const [loading, setLoading] = useState(true);

  // Check if data is loaded
  useEffect(() => {
    if (sacrifices.length > 0 && shareholders.length > 0) {
      setLoading(false);
    }
  }, [sacrifices, shareholders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Genel Bakış</h1>
        <p className="text-muted-foreground mt-2">
          Kurban satış ve dağıtım sürecinin özet bilgilerini görebilirsiniz
        </p>
      </div>

      {/* Stats Grid */}
        <SummaryCards />

      {/* Sales Charts */}
      <SummaryGraphs />

      {/* Recent Activities and Payments */}
      <div className="grid gap-4 grid-cols-2">
        {/* Recent Activities */}
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Son Hareketler</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="relative space-y-6">
                {/* Content removed as requested */}
                <p className="text-sm text-muted-foreground">Henüz hareket bulunmuyor.</p>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Son Ödemeler</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="relative space-y-6">
                {/* Content removed as requested */}
                <p className="text-sm text-muted-foreground">Henüz ödeme bulunmuyor.</p>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
