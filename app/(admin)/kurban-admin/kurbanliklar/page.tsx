"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const chartConfig = {
  emptyShares: {
    label: "Boş",
    color: "#f0fbf1",
  },
  completedAnimals: {
    label: "Dolu",
    color: "#39C645",
  },
} satisfies ChartConfig;

export default function KurbanliklarPage() {
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    async function fetchChartData() {
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

      console.log('Chart Data:', chartData);
      setChartData(chartData || []);
    }

    fetchChartData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kurbanlıklar</h1>
        <p className="text-muted-foreground">
          Kurbanlıkların genel durumu ve detayları
        </p>
      </div>
      <SacrificeStatistics />

      {/* Kurbanlık Bedellerine Göre Satışlar */}
      <Card className="shadow-none mt-12">
        <CardHeader>
          <CardTitle>Kurbanlık Bedellerine Göre Satışlar</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px]">
            <BarChart
              data={chartData}
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
                                <div className="h-2 w-2 rounded-full" style={{ background: '#f0fbf1' }} />
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
                fill="#f0fbf1"
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
