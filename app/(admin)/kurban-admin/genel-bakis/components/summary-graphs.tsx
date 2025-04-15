"use client";

import { useState, useEffect } from "react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore";

const chartConfig = {
  today: {
    label: "Bugün",
    color: "hsl(var(--chart-1))",
  },
  week: {
    label: "Son 2 Hafta",
    color: "hsl(var(--chart-2))",
  },
  month: {
    label: "Son 1 Ay",
    color: "hsl(var(--chart-3))",
  },
  all: {
    label: "Tüm Zamanlar",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

export function SummaryGraphs() {
  const { shareholders } = useShareholderStore();
  const [chartData, setChartData] = useState<Array<{ date: string; count: number }>>([]);
  const [activeChart, setActiveChart] = useState<keyof typeof chartConfig>("today");
  const [chartTotals, setChartTotals] = useState({
    today: 0,
    week: 0,
    month: 0,
    all: 0,
  });

  // Calculate chart data based on active chart
  useEffect(() => {
    if (shareholders.length === 0) return;

    // Calculate totals for each tab
    const totals = {
      today: 0,
      week: 0,
      month: 0,
      all: 0,
    };

    // Today's total
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    totals.today = shareholders.filter((s) => {
      const purchaseDate = new Date(s.purchase_time);
      return purchaseDate >= today && purchaseDate <= todayEnd;
    }).length;

    // Last 2 weeks total
    const twoWeeksAgo = subDays(today, 14);
    totals.week = shareholders.filter((s) => {
      const purchaseDate = new Date(s.purchase_time);
      return purchaseDate >= twoWeeksAgo;
    }).length;

    // Last month total  
    const oneMonthAgo = subDays(today, 30);
    totals.month = shareholders.filter((s) => {
      const purchaseDate = new Date(s.purchase_time);
      return purchaseDate >= oneMonthAgo;
    }).length;

    // All time total
    totals.all = shareholders.length;

    setChartTotals(totals);

    // Calculate date ranges based on active chart
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    let startDate = todayDate;
    let dailySharesData;

    if (activeChart === "today") {
      // Create array of 24 hours for today
      dailySharesData = Array.from({ length: 24 }, (_, hour) => {
        const hourStart = new Date(todayDate);
        hourStart.setHours(hour, 0, 0, 0);
        const hourEnd = new Date(todayDate);
        hourEnd.setHours(hour, 59, 59, 999);

        const count = shareholders.filter((s) => {
          const purchaseDate = new Date(s.purchase_time);
          return purchaseDate >= hourStart && purchaseDate <= hourEnd;
        }).length;

        return {
          date: `${hour.toString().padStart(2, '0')}:00`,
          count,
        };
      });
    } else {
      switch (activeChart) {
        case "week":
          startDate = subDays(todayDate, 14);
          break;
        case "month":
          startDate = subDays(todayDate, 30);
          break;
        case "all":
          if (shareholders.length === 0) {
            startDate = todayDate;
          } else {
            // Find the earliest and latest purchase dates
            const dates = shareholders.map(s => new Date(s.purchase_time).getTime());
            startDate = new Date(Math.min(...dates));
          }
          break;
      }

      const dateRange = eachDayOfInterval({ start: startDate, end: todayDate });

      dailySharesData = dateRange.map((date) => {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const count = shareholders.filter((s) => {
          const purchaseDate = new Date(s.purchase_time);
          return purchaseDate >= dayStart && purchaseDate <= dayEnd;
        }).length;

        return {
          date: format(date, "dd MMM", { locale: tr }),
          count,
        };
      });
    }

    setChartData(dailySharesData);
  }, [shareholders, activeChart]);

  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-4 sm:py-5">
          <CardTitle>Satış Grafikleri</CardTitle>
          <CardDescription>
            Dönemlere göre hisse satış sayıları
          </CardDescription>
        </div>
        <div className="flex">
          {Object.keys(chartConfig).map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-8 py-3 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-12 sm:py-4"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground px-2">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg font-bold leading-none sm:text-2xl px-2">
                  {chartTotals[chart].toLocaleString()}
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
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <ChartTooltip
              cursor={{
                fill: 'rgba(0, 0, 0, 0.05)',
                stroke: 'none',
                pointerEvents: 'none',
              }}
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="Hisse Sayısı"
                />
              }
            />
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <Bar
              dataKey="count"
              fill="hsl(var(--chart-1))"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
