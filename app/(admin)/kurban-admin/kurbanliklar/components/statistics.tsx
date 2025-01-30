"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { supabase } from "@/utils/supabaseClient";
import { StatCard } from "@/components/ui/stat-card";

interface SacrificeStats {
  totalSacrifices: number;
  totalShares: number;
  emptyShares: number;
  totalAmount: number;
  collectedAmount: number;
  remainingAmount: number;
  averageSharePrice: number;
  deliveryStats: {
    kesimhane: number;
    topluTeslimat: number;
  };
  consentStats: {
    verildi: number;
    bekliyor: number;
  };
  completedSacrifices: number;
}

const COLORS = {
  green: "#22c55e",
  yellow: "#eab308",
  red: "#ef4444",
  blue: "#3b82f6",
  purple: "#a855f7",
};

export function SacrificeStatistics() {
  const [stats, setStats] = useState<SacrificeStats>({
    totalSacrifices: 0,
    totalShares: 0,
    emptyShares: 0,
    totalAmount: 0,
    collectedAmount: 0,
    remainingAmount: 0,
    averageSharePrice: 0,
    deliveryStats: {
      kesimhane: 0,
      topluTeslimat: 0,
    },
    consentStats: {
      verildi: 0,
      bekliyor: 0,
    },
    completedSacrifices: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch sacrifices data
        const { data: sacrifices, error: sacrificesError } = await supabase
          .from("sacrifice_animals")
          .select("*");

        if (sacrificesError) throw sacrificesError;

        // Fetch shareholders data
        const { data: shareholders, error: shareholdersError } = await supabase
          .from("shareholders")
          .select("*");

        if (shareholdersError) throw shareholdersError;

        // Calculate basic statistics
        const totalSacrifices = sacrifices?.length || 0;
        const totalShares = sacrifices?.reduce((acc, curr) => acc + 7, 0) || 0;
        const emptyShares = sacrifices?.reduce((acc, curr) => acc + (curr.empty_share || 0), 0) || 0;

        // Calculate financial statistics
        const totalAmount = shareholders?.reduce((acc, curr) => acc + curr.total_amount, 0) || 0;
        const collectedAmount = shareholders?.reduce((acc, curr) => acc + curr.paid_amount, 0) || 0;
        const remainingAmount = totalAmount - collectedAmount;
        const averageSharePrice = shareholders?.length ? totalAmount / shareholders.length : 0;

        // Calculate delivery statistics
        const deliveryStats = {
          kesimhane: shareholders?.filter(s => s.delivery_type === "Kesimhane").length || 0,
          topluTeslimat: shareholders?.filter(s => s.delivery_type === "Toplu Teslim Noktası").length || 0,
        };

        // Calculate consent statistics
        const consentStats = {
          verildi: shareholders?.filter(s => s.sacrifice_consent === true).length || 0,
          bekliyor: shareholders?.filter(s => s.sacrifice_consent === false).length || 0,
        };

        // Count sacrifices with no empty shares
        const completedSacrifices = sacrifices?.filter(
          (s) => s.empty_share === 0
        ).length || 0;

        // Teslimat noktalarına göre dağılım
        const deliveryLocationStats = shareholders.reduce((acc, curr) => {
          const location = curr.delivery_location
          acc[location] = (acc[location] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const deliveryLocationData = {
          labels: Object.keys(deliveryLocationStats).map(location => {
            switch (location) {
              case "kesimhane":
                return "Kesimhanede Teslim"
              case "yenimahalle-pazar-yeri":
                return "Yenimahalle Pazar Yeri"
              case "kecioren-otoparki":
                return "Keçiören Otoparkı"
              default:
                return location
            }
          }),
          datasets: [
            {
              label: "Hissedar Sayısı",
              data: Object.values(deliveryLocationStats),
            },
          ],
        }

        setStats({
          totalSacrifices,
          totalShares,
          emptyShares,
          totalAmount,
          collectedAmount,
          remainingAmount,
          averageSharePrice,
          deliveryStats,
          consentStats,
          completedSacrifices,
        });
      } catch (error) {
        console.error("Error fetching sacrifice statistics:", error);
      }
    }

    fetchStats();
  }, []);

  const paymentData = [
    {
      name: "Ödemeler",
      "Toplanan": stats.collectedAmount,
      "Kalan": stats.remainingAmount,
    }
  ];

  return (
    <div className="grid gap-4">
      <div>
        <StatCard
          title="Kalan Kurbanlıklar"
          value={stats.totalSacrifices - stats.completedSacrifices}
          maxValue={stats.totalSacrifices}
          displayValue={stats.completedSacrifices}
          actionLink={{
            text: "Tümünü göster",
            href: "/kurban-admin/kurbanliklar/tum-kurbanliklar",
          }}
        />
      </div>
    </div>
  );
} 