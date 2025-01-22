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
}



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
  });

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

      {/* Kurbanlık Bedellerine Göre Satışlar */}
      <Card>
        <CardHeader>
          <CardTitle>Kurbanlık Bedellerine Göre Satışlar</CardTitle>
          <CardDescription>Tooltip with line indicator.</CardDescription>
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
                defaultIndex={1}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
