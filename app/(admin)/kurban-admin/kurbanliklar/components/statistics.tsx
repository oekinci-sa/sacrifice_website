"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { supabase } from "@/utils/supabaseClient";

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
        });
      } catch (error) {
        console.error("Error fetching sacrifice statistics:", error);
      }
    }

    fetchStats();
  }, []);

  const deliveryData = [
    { name: "Kesimhane", value: stats.deliveryStats.kesimhane, color: COLORS.blue },
    { name: "Toplu Teslim", value: stats.deliveryStats.topluTeslimat, color: COLORS.purple },
  ];

  const consentData = [
    { name: "Vekalet Alındı", value: stats.consentStats.verildi, color: COLORS.green },
    { name: "Vekalet Bekleniyor", value: stats.consentStats.bekliyor, color: COLORS.yellow },
  ];

  const paymentData = [
    {
      name: "Ödemeler",
      "Toplanan": stats.collectedAmount,
      "Kalan": stats.remainingAmount,
    }
  ];

  return (
    <div className="grid gap-4">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kurbanlık</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSacrifices}</div>
            <p className="text-xs text-muted-foreground">
              Toplam {stats.totalShares} hisse
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Boş Hisseler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emptyShares}</div>
            <Progress 
              value={stats.totalShares > 0 ? ((stats.totalShares - stats.emptyShares) / stats.totalShares) * 100 : 0}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground">
              Doluluk oranı: {stats.totalShares > 0 ? (((stats.totalShares - stats.emptyShares) / stats.totalShares) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Tutar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ortalama Hisse: {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.averageSharePrice)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplanan Ödeme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.collectedAmount)}
            </div>
            <Progress 
              value={stats.totalAmount > 0 ? (stats.collectedAmount / stats.totalAmount) * 100 : 0}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground">
              Tahsilat oranı: {stats.totalAmount > 0 ? ((stats.collectedAmount / stats.totalAmount) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Ödeme Durumu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => 
                      new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(value))
                    }
                  />
                  <Bar dataKey="Toplanan" stackId="a" fill={COLORS.green} />
                  <Bar dataKey="Kalan" stackId="a" fill={COLORS.yellow} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teslimat Tercihleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deliveryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                    label
                  >
                    {deliveryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Vekalet Durumu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={consentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                    label
                  >
                    {consentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 