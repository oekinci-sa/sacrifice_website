"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { formatDateChartShort, formatDateShort } from "@/lib/date-utils";
import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore";
import { eachDayOfInterval, subDays } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarRange } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis
} from "recharts";

function getSalesChartBarColor(logoSlug: string): string {
  if (logoSlug === "elya-hayvancilik") {
    return "var(--sac-blue)";
  }
  if (logoSlug === "ankara-kurban") {
    return "var(--sac-tenant-primary)";
  }
  return "var(--sac-tenant-primary)";
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function SummaryGraphs() {
  const { logo_slug } = useTenantBranding();
  const salesBarColor = useMemo(() => getSalesChartBarColor(logo_slug), [logo_slug]);

  const chartConfig = useMemo(
    () =>
      ({
        today: { label: "Bugün", color: salesBarColor },
        week1: { label: "Son 1 Hafta", color: salesBarColor },
        week: { label: "Son 2 Hafta", color: salesBarColor },
        month: { label: "Son 1 Ay", color: salesBarColor },
        all: { label: "Tüm Dönem", color: salesBarColor },
      }) satisfies ChartConfig,
    [salesBarColor]
  );

  const { shareholders } = useShareholderStore();
  const [chartData, setChartData] = useState<Array<{ date: string; count: number }>>([]);
  const [activeChart, setActiveChart] = useState<
    "today" | "week1" | "week" | "month" | "all"
  >("today");
  const [rangeMode, setRangeMode] = useState<"preset" | "custom">("preset");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [rangeDraft, setRangeDraft] = useState<DateRange | undefined>(undefined);
  const [appliedCustomRange, setAppliedCustomRange] = useState<DateRange | undefined>(undefined);
  const [twoMonthsCalendar, setTwoMonthsCalendar] = useState(false);
  const [chartTotals, setChartTotals] = useState({
    today: 0,
    week1: 0,
    week: 0,
    month: 0,
    all: 0,
  });

  const customRangeTotal = useMemo(() => {
    if (!appliedCustomRange?.from) return 0;
    const from = startOfLocalDay(appliedCustomRange.from);
    const to = endOfLocalDay(appliedCustomRange.to ?? appliedCustomRange.from);
    return shareholders.filter((s) => {
      const purchaseDate = new Date(s.purchase_time);
      return purchaseDate >= from && purchaseDate <= to;
    }).length;
  }, [shareholders, appliedCustomRange]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const apply = () => setTwoMonthsCalendar(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const customRangeLabel = useMemo(() => {
    if (!appliedCustomRange?.from) return null;
    const a = formatDateShort(appliedCustomRange.from);
    const b = appliedCustomRange.to
      ? formatDateShort(appliedCustomRange.to)
      : a;
    return a === b ? a : `${a} – ${b}`;
  }, [appliedCustomRange]);

  useEffect(() => {
    if (shareholders.length === 0) return;

    const totals = {
      today: 0,
      week1: 0,
      week: 0,
      month: 0,
      all: 0,
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    totals.today = shareholders.filter((s) => {
      const purchaseDate = new Date(s.purchase_time);
      return purchaseDate >= today && purchaseDate <= todayEnd;
    }).length;

    const oneWeekAgo = subDays(today, 7);
    totals.week1 = shareholders.filter((s) => {
      const purchaseDate = new Date(s.purchase_time);
      return purchaseDate >= oneWeekAgo;
    }).length;

    const twoWeeksAgo = subDays(today, 14);
    totals.week = shareholders.filter((s) => {
      const purchaseDate = new Date(s.purchase_time);
      return purchaseDate >= twoWeeksAgo;
    }).length;

    const oneMonthAgo = subDays(today, 30);
    totals.month = shareholders.filter((s) => {
      const purchaseDate = new Date(s.purchase_time);
      return purchaseDate >= oneMonthAgo;
    }).length;

    totals.all = shareholders.length;

    setChartTotals(totals);

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    let dailySharesData: Array<{ date: string; count: number }>;

    if (rangeMode === "custom" && appliedCustomRange?.from) {
      const fromDay = startOfLocalDay(appliedCustomRange.from);
      const toDay = startOfLocalDay(appliedCustomRange.to ?? appliedCustomRange.from);
      const sameCalendarDay = fromDay.getTime() === toDay.getTime();

      if (sameCalendarDay) {
        const d = fromDay;
        dailySharesData = Array.from({ length: 24 }, (_, hour) => {
          const hourStart = new Date(d);
          hourStart.setHours(hour, 0, 0, 0);
          const hourEnd = new Date(d);
          hourEnd.setHours(hour, 59, 59, 999);
          const count = shareholders.filter((s) => {
            const purchaseDate = new Date(s.purchase_time);
            return purchaseDate >= hourStart && purchaseDate <= hourEnd;
          }).length;
          return {
            date: `${hour.toString().padStart(2, "0")}:00`,
            count,
          };
        });
      } else {
        const dateRange = eachDayOfInterval({ start: fromDay, end: toDay });
        dailySharesData = dateRange.map((date) => {
          const dayStart = startOfLocalDay(date);
          const dayEnd = endOfLocalDay(date);
          const count = shareholders.filter((s) => {
            const purchaseDate = new Date(s.purchase_time);
            return purchaseDate >= dayStart && purchaseDate <= dayEnd;
          }).length;
          return {
            date: formatDateChartShort(date),
            count,
          };
        });
      }
    } else if (activeChart === "today") {
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
          date: `${hour.toString().padStart(2, "0")}:00`,
          count,
        };
      });
    } else {
      let startDate = todayDate;
      let endDate = todayDate;

      switch (activeChart) {
        case "week1":
          startDate = subDays(todayDate, 7);
          break;
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
            const dates = shareholders.map(s => new Date(s.purchase_time).getTime());
            startDate = new Date(Math.min(...dates));
            endDate = new Date(Math.max(...dates));
            endDate.setHours(23, 59, 59, 999);
          }
          break;
      }

      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

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
          date: formatDateChartShort(date),
          count,
        };
      });
    }

    setChartData(dailySharesData);
  }, [shareholders, activeChart, rangeMode, appliedCustomRange]);

  const presetSelect = (key: typeof activeChart) => {
    setRangeMode("preset");
    setActiveChart(key);
  };

  const openCalendar = (open: boolean) => {
    setCalendarOpen(open);
    if (open) {
      setRangeDraft(
        appliedCustomRange?.from
          ? {
            from: appliedCustomRange.from,
            to: appliedCustomRange.to ?? appliedCustomRange.from,
          }
          : undefined
      );
    }
  };

  const applyDraftRange = () => {
    if (!rangeDraft?.from) return;
    setAppliedCustomRange({
      from: rangeDraft.from,
      to: rangeDraft.to ?? rangeDraft.from,
    });
    setRangeMode("custom");
    setCalendarOpen(false);
  };

  const todayStart = useMemo(() => {
    const n = new Date();
    n.setHours(0, 0, 0, 0);
    return n;
  }, []);

  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 md:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-4 md:py-5">
          <CardTitle>Satış Grafikleri</CardTitle>
          <CardDescription>
            Dönemlere göre hisse satış sayıları
          </CardDescription>
        </div>
        <div className="flex flex-wrap md:flex-nowrap">
          {(Object.keys(chartConfig) as (keyof typeof chartConfig)[]).map((key) => (
            <button
              key={key}
              type="button"
              data-active={rangeMode === "preset" && activeChart === key}
              className="relative z-30 flex min-w-[100px] flex-1 flex-col justify-center gap-1 border-t px-4 py-3 text-left even:border-l data-[active=true]:bg-muted/50 md:border-l md:border-t-0 md:px-8 md:py-4"
              onClick={() => presetSelect(key)}
            >
              <span className="text-xs text-muted-foreground px-2">
                {chartConfig[key].label}
              </span>
              <span className="text-lg font-bold leading-none md:text-2xl px-2">
                {chartTotals[key].toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Popover open={calendarOpen} onOpenChange={openCalendar}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant={rangeMode === "custom" ? "secondary" : "outline"}
              size="sm"
              className="h-9 w-full justify-center gap-2 sm:w-auto shrink-0"
            >
              <CalendarRange className="h-4 w-4" />
              {rangeMode === "custom" && customRangeLabel
                ? (
                  <span className="font-medium tabular-nums">
                    {customRangeLabel}
                    <span className="ml-2 text-muted-foreground font-normal">
                      ({customRangeTotal.toLocaleString()})
                    </span>
                  </span>
                )
                : "Tarih aralığı seç"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 border-b space-y-2">
              <p className="text-sm font-medium">Özel tarih aralığı</p>
              <p className="text-xs text-muted-foreground">
                Başlangıç ve bitiş gününü seçin. Tek gün için aynı güne iki kez tıklayın veya bitişi boş bırakıp uygulayın.
              </p>
            </div>
            <Calendar
              mode="range"
              locale={tr}
              numberOfMonths={twoMonthsCalendar ? 2 : 1}
              defaultMonth={rangeDraft?.from ?? appliedCustomRange?.from ?? new Date()}
              selected={rangeDraft}
              onSelect={setRangeDraft}
              disabled={(date) => startOfLocalDay(date) > todayStart}
              captionLayout="dropdown"
              className="rounded-lg"
            />
            <div className="flex gap-2 justify-end p-3 border-t bg-muted/30">
              <Button type="button" variant="ghost" size="sm" onClick={() => setCalendarOpen(false)}>
                Kapat
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!rangeDraft?.from}
                onClick={applyDraftRange}
              >
                Grafiği uygula
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        {rangeMode === "custom" ? (
          <p className="text-xs text-muted-foreground sm:max-w-[55%]">
            Grafik seçtiğiniz aralığa göre. Hazır dönem sekmelerinden birine tıklayarak çıkabilirsiniz.
          </p>
        ) : null}
      </div>
      <CardContent className="px-2 md:p-6">
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
                fill: "hsl(var(--muted) / 0.5)",
                stroke: "none",
                pointerEvents: "none",
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
              fill={salesBarColor}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
