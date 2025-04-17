"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { supabase } from "@/utils/supabaseClient";
import { eachDayOfInterval, format, subDays } from "date-fns";
import { tr } from "date-fns/locale";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SacrificeStatistics } from "./components/statistics";

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
  const [activeChart, setActiveChart] = useState<keyof typeof chartConfig>("today");
  const [chartData, setChartData] = useState<SharesData[]>([]);
  const [priceChartData, setPriceChartData] = useState<ChartData[]>([]);
  const [sacrificeSharesData, setSacrificeSharesData] = useState<SacrificeSharesData[]>([]);
  const [chartTotals, setChartTotals] = useState({
    today: 0,
    week: 0,
    month: 0,
    all: 0,
    shares: 0,
  });

  useEffect(() => {
    async function fetchAllData() {
      try {
        // Fetch sacrifices data
        const { data: sacrifices, error: sacrificesError } = await supabase
          .from('sacrifice_animals')
          .select('*')
          .order('sacrifice_no');

        if (sacrificesError) {
          console.error('Error fetching sacrifices:', sacrificesError);
          return;
        }

        // Fetch shareholders data
        const { data: shareholders, error: shareholdersError } = await supabase
          .from('shareholders')
          .select('*');

        if (shareholdersError) {
          console.error('Error fetching shareholders:', shareholdersError);
          return;
        }

        // Calculate shares distribution data
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

        // Calculate price chart data
        const priceData = sacrifices.reduce((acc: Record<number, ChartData>, sacrifice) => {
          const sharePrice = sacrifice.share_price;
          if (!acc[sharePrice]) {
            acc[sharePrice] = {
              sharePrice,
              completedAnimals: 0,
              emptyShares: 0,
              totalAnimals: 0,
            };
          }
          acc[sharePrice].totalAnimals++;
          if (sacrifice.empty_share === 0) {
            acc[sharePrice].completedAnimals++;
          }
          acc[sharePrice].emptyShares += sacrifice.empty_share;
          return acc;
        }, {});

        setPriceChartData(Object.values(priceData).sort((a, b) => a.sharePrice - b.sharePrice));

        // Calculate daily shares data based on active chart
        const today = new Date();
        let startDate = today;
        let dateFormat = "HH:mm";
        let dates: Date[] = [];

        switch (activeChart) {
          case "today": {
            // Bugünün başlangıcı (00:00)
            startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            // 24 saatlik veriyi oluştur
            dates = Array.from({ length: 24 }, (_, i) => {
              const date = new Date(startDate);
              date.setHours(i);
              return date;
            });
            break;
          }
          case "week":
            startDate = subDays(today, 14);
            dateFormat = "dd MMM";
            dates = eachDayOfInterval({ start: startDate, end: today });
            break;
          case "month":
            startDate = subDays(today, 30);
            dateFormat = "dd MMM";
            dates = eachDayOfInterval({ start: startDate, end: today });
            break;
          case "all": {
            const allDates = shareholders.map(s => new Date(s.purchase_time).getTime());
            if (allDates.length > 0) {
              startDate = new Date(Math.min(...allDates));
              dateFormat = "dd MMM";
              dates = eachDayOfInterval({ start: startDate, end: today });
            }
            break;
          }
        }

        const dailySharesData = dates.map(date => {
          const formattedDate = format(date, dateFormat, { locale: tr });
          const count = shareholders.filter(s => {
            const purchaseDate = new Date(s.purchase_time);
            if (activeChart === "today") {
              // Saat bazında kontrol
              return format(purchaseDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd") &&
                purchaseDate.getHours() === date.getHours();
            }
            // Gün bazında kontrol
            return format(purchaseDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
          }).length;

          return {
            date: formattedDate,
            count,
          };
        });

        setChartData(dailySharesData);

        // Calculate chart totals
        const todayStr = format(today, "yyyy-MM-dd");
        const weekAgoStr = format(subDays(today, 14), "yyyy-MM-dd");
        const monthAgoStr = format(subDays(today, 30), "yyyy-MM-dd");

        setChartTotals(prev => ({
          ...prev,
          today: shareholders.filter(s => format(new Date(s.purchase_time), "yyyy-MM-dd") === todayStr).length,
          week: shareholders.filter(s => {
            const purchaseDate = format(new Date(s.purchase_time), "yyyy-MM-dd");
            return purchaseDate >= weekAgoStr && purchaseDate <= todayStr;
          }).length,
          month: shareholders.filter(s => {
            const purchaseDate = format(new Date(s.purchase_time), "yyyy-MM-dd");
            return purchaseDate >= monthAgoStr && purchaseDate <= todayStr;
          }).length,
          all: shareholders.length,
        }));

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    fetchAllData();
  }, [activeChart]); // activeChart değiştiğinde yeniden çalışacak

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
                tickFormatter={(value) => `${value.toLocaleString('tr-TR')}  TL`}
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
                              {`${price.toLocaleString('tr-TR')}  TL`}
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
