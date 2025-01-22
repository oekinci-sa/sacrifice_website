"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
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
import { ActivityTable } from "./components/activity-table";
import { ProgressCard } from "@/components/ui/progress-card";
import { StatCard } from "@/components/ui/stat-card";

import { CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";

import { CardFooter, CardDescription } from "@/components/ui/card";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { ScrollArea } from "@/components/ui/scroll-area";

const chartData = [
  { date: "2024-04-01", desktop: 222, mobile: 150 },
  { date: "2024-04-02", desktop: 97, mobile: 180 },
  { date: "2024-04-03", desktop: 167, mobile: 120 },
  { date: "2024-06-30", desktop: 446, mobile: 400 },
];

const chartConfig = {
  views: {
    label: "Page Views",
  },
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const chartDatam = [
  { date: "2024-07-15", running: 450, swimming: 300 },
  { date: "2024-07-16", running: 380, swimming: 420 },
  { date: "2024-07-17", running: 520, swimming: 120 },
  { date: "2024-07-18", running: 140, swimming: 550 },
  { date: "2024-07-19", running: 600, swimming: 350 },
  { date: "2024-07-20", running: 480, swimming: 400 },
];

const chartConfigm = {
  running: {
    label: "Running",
    color: "hsl(var(--chart-1))",
  },
  swimming: {
    label: "Swimming",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

interface DashboardStats {
  totalShares: number;
  emptyShares: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  totalShareholders: number;
  totalSacrifices: number;
  remainingSacrifices: number;
  remainingDeposits: number;
  deliveryStats: {
    kesimhane: number;
    topluTeslimat: number;
  };
  deliveryLocations: {
    [key: string]: number;
  };
}

interface ActivityLog {
  event_id: string;
  changed_at: string;
  description: string;
  change_type: "Ekleme" | "Güncelleme" | "Silme";
  column_name: string;
  old_value: string;
  new_value: string;
}

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

const COLORS = {
  green: "#22c55e",
  red: "#ef4444",
  blue: "#3b82f6",
  purple: "#a855f7",
  yellow: "#eab308",
} as const;

// Helper function to format location names
const formatLocationName = (location: string) => {
  switch (location) {
    case "kesimhane":
      return "Kesimhane";
    case "yenimahalle-pazar-yeri":
      return "Yenimahalle Pazar Yeri";
    case "kecioren-otoparki":
      return "Keçiören Otoparkı";
    default:
      return location;
  }
};

// Helper function to get custom description
const getCustomDescription = (log: ActivityLog, totalAmount: number) => {
  if (log.change_type === "Ekleme") {
    return "Hisse alımı gerçekleştirildi";
  }

  if (log.column_name === "Ödenen Tutar") {
    const newValue = parseInt(log.new_value);
    if (newValue === totalAmount) {
      return "Tüm ödemeler tamamlandı.";
    }
    return `Yapılan ödeme miktarı ${parseInt(log.old_value).toLocaleString('tr-TR')} TL'den ${newValue.toLocaleString('tr-TR')} TL'ye yükseldi.`;
  }

  if (log.column_name === "Teslimat Noktası") {
    const oldLocation = formatLocationName(log.old_value);
    const newLocation = formatLocationName(log.new_value);
    return `Hisse teslimi ${oldLocation} yerine ${newLocation}'nda yapılacak.`;
  }

  return log.description;
};

export default function GeneralOverviewPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalShares: 0,
    emptyShares: 0,
    totalAmount: 0,
    paidAmount: 0,
    remainingAmount: 0,
    totalShareholders: 0,
    totalSacrifices: 0,
    remainingSacrifices: 0,
    remainingDeposits: 0,
    deliveryStats: {
      kesimhane: 0,
      topluTeslimat: 0,
    },
    deliveryLocations: {},
  });
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch sacrifice animals data
        const { data: sacrificeData, error: sacrificeError } = await supabase
          .from("sacrifice_animals")
          .select("empty_share");

        if (sacrificeError) throw sacrificeError;

        const totalShares = sacrificeData.length * 7; // Each sacrifice has 7 shares
        const emptyShares = sacrificeData.reduce(
          (sum, sacrifice) => sum + (sacrifice.empty_share || 0),
          0
        );
        const remainingSacrifices = sacrificeData.filter(
          (s) => s.empty_share > 0
        ).length;

        // Fetch shareholders data with purchase_time
        const { data: shareholdersData, error: shareholdersError } =
          await supabase
            .from("shareholders")
            .select("total_amount, paid_amount, purchase_time");

        if (shareholdersError) throw shareholdersError;

        const totalAmount = shareholdersData.reduce(
          (sum, shareholder) => sum + (shareholder.total_amount || 0),
          0
        );
        const paidAmount = shareholdersData.reduce(
          (sum, shareholder) => sum + (shareholder.paid_amount || 0),
          0
        );

        // Calculate remaining deposits (less than 2000 TL paid)
        const remainingDeposits = shareholdersData.filter(
          (s) => s.paid_amount < 2000
        ).length;

        // Calculate daily shares data
        const today = new Date();
        const startDate = subDays(today, 6);
        const dateRange = eachDayOfInterval({ start: startDate, end: today });

        const dailySharesData = dateRange.map((date) => {
          const dayStart = new Date(date.setHours(0, 0, 0, 0));
          const dayEnd = new Date(date.setHours(23, 59, 59, 999));

          const count = shareholdersData.filter((s) => {
            const purchaseDate = new Date(s.purchase_time);
            return purchaseDate >= dayStart && purchaseDate <= dayEnd;
          }).length;

          return {
            date: format(date, "dd MMM", { locale: tr }),
            count,
          };
        });

        // Calculate payment status data
        const paid = shareholdersData.filter(
          (s) => s.paid_amount >= s.total_amount
        ).length;
        const pending = shareholdersData.length - paid;

        // Fetch activity logs
        const { data: logsData, error: logsError } = await supabase
          .from("change_logs")
          .select("*")
          .order("changed_at", { ascending: false })
          .limit(10);

        if (logsError) throw logsError;

        setActivityLogs(logsData);

        setStats({
          totalShares,
          emptyShares,
          totalAmount,
          paidAmount,
          remainingAmount: totalAmount - paidAmount,
          totalShareholders: shareholdersData.length,
          totalSacrifices: sacrificeData.length,
          remainingSacrifices,
          remainingDeposits,
          deliveryStats: {
            kesimhane: 0,
            topluTeslimat: 0,
          },
          deliveryLocations: {},
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("desktop");

  const total = React.useMemo(
    () => ({
      desktop: chartData.reduce((acc, curr) => acc + curr.desktop, 0),
      mobile: chartData.reduce((acc, curr) => acc + curr.mobile, 0),
    }),
    []
  );

  // Chart data
  const paymentStatusData: ChartDataItem[] = [
    { name: "Tamamlandı", value: stats.totalShareholders - stats.remainingDeposits, color: COLORS.green },
    { name: "Kapora Bekleniyor", value: stats.remainingDeposits, color: COLORS.red },
  ];

  const deliveryData: ChartDataItem[] = [
    { name: "Kesimhane", value: stats.deliveryStats.kesimhane, color: COLORS.blue },
    { name: "Toplu Teslim", value: stats.deliveryStats.topluTeslimat, color: COLORS.purple },
  ];

  const locationData: ChartDataItem[] = Object.entries(stats.deliveryLocations).map(([name, value], index) => ({
    name: formatLocationName(name),
    value,
    color: Object.values(COLORS)[index % Object.values(COLORS).length],
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-heading">Genel Bakış</h1>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Kalan Kurbanlıklar"
          value={stats.remainingSacrifices}
          maxValue={stats.totalSacrifices}
        />
        <StatCard
          title="Kalan Hisseler"
          value={stats.emptyShares}
          maxValue={stats.totalShares}
        />
        <StatCard
          title="Eksik Kaporalar"
          value={stats.remainingDeposits}
          maxValue={stats.totalShareholders}
          actionLink={{
            text: "Tümünü göster",
            href: "/kurban-admin/odeme-analizi?tab=eksik-kapora",
          }}
        />
        <StatCard
          title="Toplam Ödemeler"
          value={stats.paidAmount}
          maxValue={stats.totalAmount}
          suffix=" TL"
        />
      </div>

      {/* Günlük Hisse Alımları */}
      <Card>
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
            <CardTitle>Satış Grafikleri</CardTitle>
            <CardDescription>
              Showing total visitors for the last 3 months
            </CardDescription>
          </div>
          <div className="flex">
            {["desktop", "mobile"].map((key) => {
              const chart = key as keyof typeof chartConfig;
              return (
                <button
                  key={chart}
                  data-active={activeChart === chart}
                  className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                  onClick={() => setActiveChart(chart)}
                >
                  <span className="text-xs text-muted-foreground">
                    {chartConfig[chart].label}
                  </span>
                  <span className="text-lg font-bold leading-none sm:text-3xl">
                    {total[key as keyof typeof total].toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[150px]"
                    nameKey="views"
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                    }}
                  />
                }
              />
              <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Kurbanlık Bedelleri ve Son Hareketler */}
      <div className="grid gap-4 grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Kurbanlık Bedellerine Göre Satışlar</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfigm}>
              <BarChart accessibilityLayer data={chartDatam}>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      weekday: "short",
                    });
                  }}
                />
                <Bar
                  dataKey="running"
                  stackId="a"
                  fill="var(--color-running)"
                  radius={[0, 0, 4, 4]}
                />
                <Bar
                  dataKey="swimming"
                  stackId="a"
                  fill="var(--color-swimming)"
                  radius={[4, 4, 0, 0]}
                />
                <ChartTooltip
                  content={<ChartTooltipContent indicator="line" />}
                  cursor={false}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Son Hareketler</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="relative space-y-6">
                {activityLogs?.slice(0, 10).map((log, index, array) => (
                  <div key={log.event_id} className="relative">
                    <div className="flex items-start gap-6">
                      <div className="flex flex-col items-center">
                        <div className="relative w-14 h-14 bg-[#00B074]/10 rounded-full flex items-center justify-center shrink-0 z-10">
                          {log.change_type === "Ekleme" ? (
                            <i className="bi bi-person-check-fill text-[#00B074] text-2xl" />
                          ) : log.column_name === "Ödenen Tutar" ? (
                            <i className="bi bi-wallet2 text-[#00B074] text-2xl" />
                          ) : log.column_name === "Teslimat Noktası" ? (
                            <i className="bi bi-geo-alt-fill text-[#00B074] text-2xl" />
                          ) : (
                            <div className="w-4 h-4 bg-[#00B074] rounded-full" />
                          )}
                        </div>
                        {index < array.length - 1 && (
                          <div className="w-[2px] h-12 bg-[#DBDDE1] mt-4 mb-4" />
                        )}
                      </div>
                      <div className="pt-2">
                        <p className="text-sm text-muted-foreground font-heading">
                          {format(new Date(log.changed_at), "dd.MM.yyyy - HH:mm", { locale: tr })}
                        </p>
                        <p className="font-medium font-heading">
                          {getCustomDescription(log, parseInt(log.new_value))}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!activityLogs || activityLogs.length === 0) && (
                  <p className="text-sm text-muted-foreground">Henüz hareket bulunmuyor.</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Activities */}
      <div className="grid gap-4">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* ... existing cards ... */}
        </div>

        {/* Charts and Recent Activities */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Payment Status Chart */}
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

          {/* Delivery Preferences Chart */}
          <Card className="col-span-2 shadow-none">
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

          {/* Delivery Locations Chart */}
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
    </div>
  );
}
