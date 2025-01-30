"use client";

import { useEffect, useState } from "react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SacrificeStatistics } from "./components/statistics";
import { supabase } from "@/utils/supabaseClient";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface ChartData {
  sharePrice: number;
  completedAnimals: number;
  emptyShares: number;
  totalAnimals: number;
}

interface SharesData {
  date: string;
  count: number;
}

interface SacrificeSharesData {
  sacrifice_no: number;
  full_payment: number;
  partial_payment: number;
  no_payment: number;
}

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
  shares: {
    label: "Tüm Kurbanlıklar",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

export default function KurbanliklarPage() {
  const [chartData, setChartData] = useState<SharesData[]>([]);
  const [priceChartData, setPriceChartData] = useState<ChartData[]>([]);
  const [sacrificeSharesData, setSacrificeSharesData] = useState<SacrificeSharesData[]>([]);
  const [activeChart, setActiveChart] = useState<keyof typeof chartConfig>("shares");
  const [chartTotals, setChartTotals] = useState({
    today: 0,
    week: 0,
    month: 0,
    all: 0,
    shares: 0,
  });

  // Fetch price chart data
  useEffect(() => {
    async function fetchPriceChartData() {
      const { data: sacrifices, error } = await supabase
        .from('sacrifice_animals')
        .select('share_price, empty_share');

      if (error) {
        console.error('Error fetching chart data:', error);
        return;
      }

      const chartData = sacrifices?.reduce((acc: ChartData[], sacrifice) => {
        const { share_price, empty_share } = sacrifice;
        const existingEntry = acc.find((entry) => entry.sharePrice === share_price);

        if (existingEntry) {
          existingEntry.totalAnimals++;
          if (empty_share === 0) {
            existingEntry.completedAnimals++;
          } else {
            existingEntry.emptyShares++;
          }
        } else {
          acc.push({
            sharePrice: share_price,
            completedAnimals: empty_share === 0 ? 1 : 0,
            totalAnimals: 1,
            emptyShares: empty_share > 0 ? 1 : 0,
          });
        }

        return acc;
      }, []);

      // Sort by sharePrice
      chartData?.sort((a, b) => a.sharePrice - b.sharePrice);
      setPriceChartData(chartData || []);
    }

    fetchPriceChartData();
  }, []);

  // Fetch shares distribution data
  useEffect(() => {
    async function fetchSacrificeShares() {
      const { data: sacrifices, error: sacrificesError } = await supabase
        .from('sacrifice_animals')
        .select('sacrifice_id, sacrifice_no')
        .order('sacrifice_no');

      if (sacrificesError) {
        console.error('Error fetching sacrifices:', sacrificesError);
        return;
      }

      const { data: shareholders, error: shareholdersError } = await supabase
        .from('shareholders')
        .select('sacrifice_id, total_amount, paid_amount');

      if (shareholdersError) {
        console.error('Error fetching shareholders:', shareholdersError);
        return;
      }

      // Calculate payment status for each sacrifice
      const sharesData = sacrifices.map(sacrifice => {
        const sacrificeHolders = shareholders.filter(s => s.sacrifice_id === sacrifice.sacrifice_id);
        
        const fullPayment = sacrificeHolders.filter(s => s.paid_amount >= s.total_amount).length;
        const noPayment = sacrificeHolders.filter(s => s.paid_amount === 0).length;
        const partialPayment = sacrificeHolders.filter(s => s.paid_amount > 0 && s.paid_amount < s.total_amount).length;

        return {
          sacrifice_no: sacrifice.sacrifice_no,
          full_payment: fullPayment,
          partial_payment: partialPayment,
          no_payment: noPayment
        };
      });

      setSacrificeSharesData(sharesData);
      setChartTotals(prev => ({
        ...prev,
        shares: sacrifices.length
      }));
    }

    fetchSacrificeShares();
  }, []);

  useEffect(() => {
    async function fetchChartData() {
      try {
        // Fetch shareholders data for chart
        const { data: shareholdersDataForChart, error: shareholdersErrorForChart } = await supabase
          .from("shareholders")
          .select("purchase_time")
          .order("purchase_time", { ascending: true });

        if (shareholdersErrorForChart) throw shareholdersErrorForChart;

        // Calculate totals for each tab
        const totals = {
          ...chartTotals,
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
        totals.today = shareholdersDataForChart.filter((s) => {
          const purchaseDate = new Date(s.purchase_time);
          return purchaseDate >= today && purchaseDate <= todayEnd;
        }).length;

        // Last 2 weeks total
        const twoWeeksAgo = subDays(today, 14);
        totals.week = shareholdersDataForChart.filter((s) => {
          const purchaseDate = new Date(s.purchase_time);
          return purchaseDate >= twoWeeksAgo;
        }).length;

        // Last month total  
        const oneMonthAgo = subDays(today, 30);
        totals.month = shareholdersDataForChart.filter((s) => {
          const purchaseDate = new Date(s.purchase_time);
          return purchaseDate >= oneMonthAgo;
        }).length;

        // All time total
        totals.all = shareholdersDataForChart.length;

        setChartTotals(totals);

        // Calculate date ranges based on active chart
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        
        let dailySharesData;

        if (activeChart === "today" || activeChart === "shares") {
          // Create array of 24 hours for today
          dailySharesData = Array.from({ length: 24 }, (_, hour) => {
            const hourStart = new Date(todayDate);
            hourStart.setHours(hour, 0, 0, 0);
            const hourEnd = new Date(todayDate);
            hourEnd.setHours(hour, 59, 59, 999);

            const count = shareholdersDataForChart.filter((s) => {
              const purchaseDate = new Date(s.purchase_time);
              return purchaseDate >= hourStart && purchaseDate <= hourEnd;
            }).length;

            return {
              date: `${hour.toString().padStart(2, '0')}:00`,
              count,
            };
          });
        } else {
          let startDate;
          let endDate = todayDate;

          switch (activeChart) {
            case "week":
              startDate = subDays(todayDate, 14);
              break;
            case "month":
              startDate = subDays(todayDate, 30);
              break;
            case "all":
              // Find the earliest and latest purchase dates
              const dates = shareholdersDataForChart.map(s => new Date(s.purchase_time).getTime());
              startDate = new Date(Math.min(...dates));
              endDate = new Date(Math.max(...dates));
              break;
          }

          const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
          
          dailySharesData = dateRange.map((date) => {
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const count = shareholdersDataForChart.filter((s) => {
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
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    }

    if (activeChart !== 'shares') {
      fetchChartData();
    }
  }, [activeChart]);

  // Initial data load for all tabs
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const { data: shareholdersDataForChart, error: shareholdersErrorForChart } = await supabase
          .from("shareholders")
          .select("purchase_time")
          .order("purchase_time", { ascending: true });

        if (shareholdersErrorForChart) throw shareholdersErrorForChart;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        const twoWeeksAgo = subDays(today, 14);
        const oneMonthAgo = subDays(today, 30);

        const totals = {
          today: shareholdersDataForChart.filter((s) => {
            const purchaseDate = new Date(s.purchase_time);
            return purchaseDate >= today && purchaseDate <= todayEnd;
          }).length,
          week: shareholdersDataForChart.filter((s) => {
            const purchaseDate = new Date(s.purchase_time);
            return purchaseDate >= twoWeeksAgo;
          }).length,
          month: shareholdersDataForChart.filter((s) => {
            const purchaseDate = new Date(s.purchase_time);
            return purchaseDate >= oneMonthAgo;
          }).length,
          all: shareholdersDataForChart.length,
          shares: chartTotals.shares,
        };

        setChartTotals(totals);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    }

    fetchInitialData();
  }, []);

  const renderChart = () => {
    if (activeChart === 'shares') {
      return (
        <BarChart
          data={sacrificeSharesData}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} className="z-0" />
          <XAxis 
            dataKey="sacrifice_no"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="z-0"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="z-0"
            domain={[0, 7]}
            ticks={[1, 2, 3, 4, 5, 6, 7]}
          />
          <Bar
            dataKey="full_payment"
            stackId="a"
            fill="#1DC355"
            radius={[4, 4, 0, 0]}
            className="z-30"
          />
          <Bar
            dataKey="partial_payment"
            stackId="a"
            fill="#3A9E5F"
            className="z-30"
          />
          <Bar
            dataKey="no_payment"
            stackId="a"
            fill="hsl(var(--chart-1))"
            className="z-30"
          />
          <ChartTooltip
            cursor={{ 
              fill: 'rgba(0, 0, 0, 0.1)',
              strokeWidth: 0,
              className: 'z-10'
            }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const sacrificeNo = payload[0].payload.sacrifice_no;
                const fullPayment = payload[0].payload.full_payment;
                const partialPayment = payload[1].payload.partial_payment;
                const noPayment = payload[2].payload.no_payment;
                
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-md">
                    <div className="grid gap-1">
                      <div className="text-left">
                        <span className="text-[0.70rem] font-semibold">
                          {`Kurbanlık No: ${sacrificeNo}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[0.70rem] gap-8">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ background: '#1DC355' }} />
                          <span className="text-muted-foreground">Tam Ödeme</span>
                        </div>
                        <span className="font-semibold">{fullPayment}</span>
                      </div>
                      <div className="flex items-center justify-between text-[0.70rem] gap-8">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ background: '#3A9E5F' }} />
                          <span className="text-muted-foreground">Kısmi Ödeme</span>
                        </div>
                        <span className="font-semibold">{partialPayment}</span>
                      </div>
                      <div className="flex items-center justify-between text-[0.70rem] gap-8">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ background: 'hsl(var(--chart-1))' }} />
                          <span className="text-muted-foreground">Ödemesiz</span>
                        </div>
                        <span className="font-semibold">{noPayment}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
            wrapperStyle={{ zIndex: 40 }}
          />
        </BarChart>
      );
    }

    return (
      <BarChart
        data={chartData}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} className="z-0" />
        <XAxis 
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          className="z-0"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          className="z-0"
        />
        <Bar
          dataKey="count"
          fill="hsl(var(--chart-1))"
          radius={[4, 4, 0, 0]}
          className="z-30"
        />
        <ChartTooltip
          cursor={{ 
            fill: 'rgba(0, 0, 0, 0.1)',
            strokeWidth: 0,
            className: 'z-10'
          }}
          content={
            <ChartTooltipContent
              className="w-[150px] z-40"
              nameKey="Hisse Sayısı"
            />
          }
          wrapperStyle={{ zIndex: 40 }}
        />
      </BarChart>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kurbanlıklar</h1>
        <p className="text-muted-foreground">
          Kurbanlıkların genel durumu ve detayları
        </p>
      </div>
      <SacrificeStatistics />

      {/* Kurbanlığa göre ödeme ve doluluk durumu */}
      <Card className="shadow-none">
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-4 sm:py-5">
            <CardTitle>Kurbanlığa göre ödeme ve doluluk durumu</CardTitle>
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
            {renderChart()}
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Kurbanlık Bedellerine Göre Satışlar */}
      <Card className="shadow-none mt-12">
        <CardHeader>
          <CardTitle>Kurbanlık Bedellerine Göre Satışlar</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px]">
            <BarChart
              data={priceChartData}
              margin={{
                left: 12,
                right: 12,
                top: 12,
                bottom: 12
              }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} className="z-0" />
              <XAxis 
                dataKey="sharePrice"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                className="z-0"
                tickFormatter={(value) => `${value.toLocaleString('tr-TR')} ₺`}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="z-0"
                tickFormatter={(value) => Math.floor(value).toString()}
              />
              <Tooltip
                cursor={{ fill: "transparent" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const price = payload[0].payload.sharePrice;
                    const emptyValue = payload[0].payload.emptyShares;
                    const completedValue = payload[0].payload.completedAnimals;
                    
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-md">
                        <div className="grid gap-1">
                          <div className="text-left">
                            <span className="text-[0.70rem] font-semibold">
                              {`${price.toLocaleString('tr-TR')} ₺`}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[0.70rem] gap-8">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full" style={{ background: '#39C645' }} />
                                <span className="text-muted-foreground">Dolu</span>
                              </div>
                              <span className="font-semibold">{completedValue}</span>
                            </div>
                            <div className="flex items-center justify-between text-[0.70rem] gap-8">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full" style={{ background: '#e5e7eb' }} />
                                <span className="text-muted-foreground">Boş</span>
                              </div>
                              <span className="font-semibold">{emptyValue}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="completedAnimals"
                fill="#39C645"
                radius={[0, 0, 4, 4]}
                className="z-20"
                stackId="a"
              />
              <Bar
                dataKey="emptyShares"
                fill="#e5e7eb"
                radius={[4, 4, 0, 0]}
                className="z-30"
                stackId="a"
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
