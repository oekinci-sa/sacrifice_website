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

interface ShareholderStats {
  totalShareholders: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStats: {
    completed: number;
    waitingDeposit: number;
    waitingRemaining: number;
  };
  deliveryStats: {
    kesimhane: number;
    topluTeslimat: number;
  };
  consentStats: {
    verildi: number;
    bekliyor: number;
  };
  deliveryLocations: {
    [key: string]: number;
  };
}

const COLORS = {
  green: "#22c55e",
  yellow: "#eab308",
  red: "#ef4444",
  blue: "#3b82f6",
  purple: "#a855f7",
};

export function ShareholderStatistics() {
  const [stats, setStats] = useState<ShareholderStats>({
    totalShareholders: 0,
    totalAmount: 0,
    paidAmount: 0,
    remainingAmount: 0,
    paymentStats: {
      completed: 0,
      waitingDeposit: 0,
      waitingRemaining: 0,
    },
    deliveryStats: {
      kesimhane: 0,
      topluTeslimat: 0,
    },
    consentStats: {
      verildi: 0,
      bekliyor: 0,
    },
    deliveryLocations: {},
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: shareholders, error } = await supabase
          .from("shareholders")
          .select("*");

        if (error) throw error;

        // Basic statistics
        const totalShareholders = shareholders.length;
        const totalAmount = shareholders.reduce((acc, curr) => acc + curr.total_amount, 0);
        const paidAmount = shareholders.reduce((acc, curr) => acc + curr.paid_amount, 0);
        const remainingAmount = totalAmount - paidAmount;

        // Payment status statistics
        const paymentStats = {
          completed: shareholders.filter(s => s.remaining_payment === 0).length,
          waitingDeposit: shareholders.filter(s => s.paid_amount < 2000).length,
          waitingRemaining: shareholders.filter(s => s.paid_amount >= 2000 && s.remaining_payment > 0).length,
        };

        // Delivery statistics
        const deliveryStats = {
          kesimhane: shareholders.filter(s => s.delivery_type === "Kesimhane").length,
          topluTeslimat: shareholders.filter(s => s.delivery_type === "Toplu Teslim Noktası").length,
        };

        // Consent statistics
        const consentStats = {
          verildi: shareholders.filter(s => s.sacrifice_consent === true).length,
          bekliyor: shareholders.filter(s => s.sacrifice_consent === false).length,
        };

        // Delivery locations statistics
        const deliveryLocations = shareholders.reduce((acc: { [key: string]: number }, curr) => {
          if (curr.delivery_location) {
            acc[curr.delivery_location] = (acc[curr.delivery_location] || 0) + 1;
          }
          return acc;
        }, {});

        setStats({
          totalShareholders,
          totalAmount,
          paidAmount,
          remainingAmount,
          paymentStats,
          deliveryStats,
          consentStats,
          deliveryLocations,
        });
      } catch (error) {
        console.error("Error fetching shareholder statistics:", error);
      }
    }

    fetchStats();
  }, []);

  const paymentStatusData = [
    { name: "Tamamlandı", value: stats.paymentStats.completed, color: COLORS.green },
    { name: "Kapora Bekleniyor", value: stats.paymentStats.waitingDeposit, color: COLORS.red },
    { name: "Kalan Ödeme Bekleniyor", value: stats.paymentStats.waitingRemaining, color: COLORS.yellow },
  ];

  const deliveryData = [
    { name: "Kesimhane", value: stats.deliveryStats.kesimhane, color: COLORS.blue },
    { name: "Toplu Teslim", value: stats.deliveryStats.topluTeslimat, color: COLORS.purple },
  ];

  const locationData = Object.entries(stats.deliveryLocations).map(([name, value], index) => ({
    name,
    value,
    color: Object.values(COLORS)[index % Object.values(COLORS).length],
  }));

  return (
    <div className="grid gap-4">
      {/* KPI Cards and Delivery Chart */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Hissedar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalShareholders}</div>
            <Progress 
              value={stats.totalShareholders > 0 
                ? (stats.paymentStats.completed / stats.totalShareholders) * 100 
                : 0}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground">
              {stats.paymentStats.completed} hissedar ödemesini tamamladı
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Tutar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.totalAmount)}
            </div>
            <Progress 
              value={stats.totalAmount > 0 ? (stats.paidAmount / stats.totalAmount) * 100 : 0}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground">
              Tahsilat oranı: {stats.totalAmount > 0 ? ((stats.paidAmount / stats.totalAmount) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplanan Ödeme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.paidAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Kalan: {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.remainingAmount)}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vekalet Durumu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.consentStats.verildi}</div>
            <Progress 
              value={stats.totalShareholders > 0 
                ? (stats.consentStats.verildi / stats.totalShareholders) * 100 
                : 0}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground">
              {stats.consentStats.bekliyor} hissedar vekalet vermedi
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teslimat Tercihleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deliveryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={40}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {deliveryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-muted-foreground text-center">
              Kesimhane: {stats.deliveryStats.kesimhane} | Toplu: {stats.deliveryStats.topluTeslimat}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card className="col-span-2 shadow-none">
          <CardHeader>
            <CardTitle>Ödeme Durumu Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                    label
                  >
                    {paymentStatusData.map((entry, index) => (
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

        <Card className="col-span-2 shadow-none">
          <CardHeader>
            <CardTitle>Teslimat Noktaları Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="Hissedar Sayısı">
                    {locationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 