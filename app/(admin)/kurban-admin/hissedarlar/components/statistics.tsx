"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart } from "@/components/ui/pie-chart";
import { supabase } from "@/utils/supabaseClient";

interface ShareholderStats {
  totalShareholders: number;
  fullPaymentCount: number;
  proxyCount: number;
  deliveryStats: {
    location: string;
    count: number;
    percentage: number;
  }[];
}

export function ShareholderStatistics() {
  const [stats, setStats] = useState<ShareholderStats>({
    totalShareholders: 0,
    fullPaymentCount: 0,
    proxyCount: 0,
    deliveryStats: [],
  });

  useEffect(() => {
    async function fetchStats() {
      const { data: shareholders, error } = await supabase
        .from("shareholders")
        .select("*");

      if (error) {
        console.error("Error fetching stats:", error);
        return;
      }

      const totalShareholders = shareholders.length;
      const fullPaymentCount = shareholders.filter(
        (s) => s.payment_status === "paid"
      ).length;
      const proxyCount = shareholders.filter(
        (s) => s.sacrifice_consent === "verildi"
      ).length;

      // Teslimat noktası istatistikleri
      const deliveryLocations = shareholders.reduce((acc, curr) => {
        if (!curr.delivery_location) return acc;
        acc[curr.delivery_location] = (acc[curr.delivery_location] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const deliveryStats = Object.entries(deliveryLocations).map(
        ([location, count]) => ({
          location: location === "yenimahalle-camii" ? "Yenimahalle Camii" : "Keçiören Pazar",
          count,
          percentage: (count / totalShareholders) * 100,
        })
      );

      setStats({
        totalShareholders,
        fullPaymentCount,
        proxyCount,
        deliveryStats,
      });
    }

    fetchStats();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Tam Ödeme İstatistiği */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Tam Ödeme Yapan Hissedarlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.fullPaymentCount} / {stats.totalShareholders}
          </div>
          <Progress
            value={(stats.fullPaymentCount / stats.totalShareholders) * 100}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {((stats.fullPaymentCount / stats.totalShareholders) * 100).toFixed(1)}% tamamlandı
          </p>
        </CardContent>
      </Card>

      {/* Vekalet İstatistiği */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Vekalet Alınan Hissedarlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.proxyCount} / {stats.totalShareholders}
          </div>
          <Progress
            value={(stats.proxyCount / stats.totalShareholders) * 100}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {((stats.proxyCount / stats.totalShareholders) * 100).toFixed(1)}% tamamlandı
          </p>
        </CardContent>
      </Card>

      {/* Teslimat Dağılımı */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Teslimat Noktası Dağılımı</CardTitle>
        </CardHeader>
        <CardContent>
          <PieChart
            data={stats.deliveryStats.map(stat => ({
              name: stat.location,
              value: stat.count,
              percentage: stat.percentage,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
} 