"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { BarChart } from "@/components/ui/bar-chart";
import { DonutChart } from "@/components/ui/donut-chart";
import { supabase } from "@/utils/supabaseClient";

interface DailyShareData {
  date: string;
  count: number;
}

interface EmptyShareStats {
  empty_share_count: number;
  animal_count: number;
}

interface PriceStats {
  share_price: number;
  total_animals: number;
  remaining_animals: number;
  fill_rate: number;
}

interface SacrificeAnimal {
  added_at: string;
  empty_share: number;
  share_price: number;
}

interface ChartValue {
  value: number;
}

export function SacrificeStatistics() {
  const [dailyShares, setDailyShares] = useState<DailyShareData[]>([]);
  const [emptyShareStats, setEmptyShareStats] = useState<EmptyShareStats[]>([]);
  const [priceStats, setPriceStats] = useState<PriceStats[]>([]);
  const [totalEmptyShares, setTotalEmptyShares] = useState(0);

  useEffect(() => {
    async function fetchStatistics() {
      // Günlük hisse alımları
      const { data: dailyData } = await supabase
        .from('sacrifice_animals')
        .select('added_at')
        .order('added_at');

      if (dailyData) {
        const dailyCounts = (dailyData as SacrificeAnimal[]).reduce((acc: { [key: string]: number }, curr) => {
          const date = format(new Date(curr.added_at), 'dd MMM', { locale: tr });
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        setDailyShares(Object.entries(dailyCounts).map(([date, count]) => ({
          date,
          count: count as number,
        })));
      }

      // Boş hisse istatistikleri
      const { data: emptyData } = await supabase
        .from('sacrifice_animals')
        .select('empty_share')
        .not('empty_share', 'eq', 0);

      if (emptyData) {
        const stats = (emptyData as SacrificeAnimal[]).reduce((acc: { [key: number]: number }, curr) => {
          acc[curr.empty_share] = (acc[curr.empty_share] || 0) + 1;
          return acc;
        }, {});

        setEmptyShareStats(Object.entries(stats).map(([empty_share, count]) => ({
          empty_share_count: parseInt(empty_share),
          animal_count: count,
        })));

        // Toplam boş hisse
        const total = (emptyData as SacrificeAnimal[]).reduce((sum: number, curr) => sum + curr.empty_share, 0);
        setTotalEmptyShares(total);
      }

      // Hisse bedeli istatistikleri
      const { data: priceData } = await supabase
        .from('sacrifice_animals')
        .select('share_price, empty_share');

      if (priceData) {
        const stats = (priceData as SacrificeAnimal[]).reduce((acc: { [key: number]: { total: number, empty: number } }, curr) => {
          if (!acc[curr.share_price]) {
            acc[curr.share_price] = { total: 0, empty: 0 };
          }
          acc[curr.share_price].total++;
          if (curr.empty_share > 0) {
            acc[curr.share_price].empty++;
          }
          return acc;
        }, {});

        setPriceStats(Object.entries(stats).map(([price, data]) => ({
          share_price: parseInt(price),
          total_animals: data.total,
          remaining_animals: data.empty,
          fill_rate: ((data.total - data.empty) / data.total) * 100,
        })).sort((a, b) => b.fill_rate - a.fill_rate));
      }
    }

    fetchStatistics();
  }, []);

  return (
    <div className="space-y-12">
      {/* Günlük Hisse Alımları Grafiği */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Günlük Hisse Alımları</h2>
        <div className="h-[300px]">
          <BarChart
            data={dailyShares}
            index="date"
            categories={["count"]}
            colors={["emerald"]}
            valueFormatter={(value: number) => `${value} hisse`}
            yAxisWidth={40}
          />
        </div>
      </div>

      <div className="grid gap-12 md:grid-cols-2">
        {/* Boş Hisse İstatistikleri */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Boş Hisse İstatistikleri</h2>
          <div className="mb-6">
            <DonutChart
              data={emptyShareStats}
              index="empty_share_count"
              category="animal_count"
              valueFormatter={(value: number) => `${value} hayvan`}
              colors={["slate", "violet", "indigo", "rose", "cyan", "amber"]}
            />
          </div>
          <div className="space-y-4">
            {emptyShareStats.map((stat) => (
              <div key={stat.empty_share_count} className="flex items-center justify-between">
                <span>{stat.empty_share_count} boş hissesi olan:</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{stat.animal_count} hayvan</span>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/kurban-admin/kurbanliklar?empty_share=${stat.empty_share_count}`}>
                      Listele
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Toplam Boş Hisse:</span>
                <span>{totalEmptyShares}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hisse Bedeli İstatistikleri */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Hisse Bedeli İstatistikleri</h2>
          <div className="mb-6">
            <BarChart
              data={priceStats}
              index="share_price"
              categories={["fill_rate"]}
              colors={["emerald"]}
              valueFormatter={(value: number) => `%${value.toFixed(1)}`}
              yAxisWidth={40}
            />
          </div>
          <div className="space-y-4">
            {priceStats.map((stat) => (
              <div key={stat.share_price} className="flex items-center justify-between">
                <span>{stat.share_price.toLocaleString('tr-TR')} ₺</span>
                <div className="flex items-center gap-4">
                  <span>
                    Toplam: {stat.total_animals} hayvan
                    {stat.remaining_animals > 0 && ` (${stat.remaining_animals} boş)`}
                  </span>
                  <span className="font-semibold text-emerald-600">
                    %{stat.fill_rate.toFixed(1)} doluluk
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/kurban-admin/kurbanliklar?share_price=${stat.share_price}`}>
                      Listele
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 