"use client";

import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  maxValue?: number;
  suffix?: string;
  displayValue?: number;
  actionLink?: {
    text: string;
    href: string;
  };
  description?: string;
  icon?: LucideIcon;
  type?: "default" | "warning";
}

interface ShareholderStatsProps {
  stats: {
    missingDeposits: number;
    missingPayments: number;
    consentStats: {
      verildi: number;
      bekliyor: number;
    };
    totalShareholders: number;
  };
  recentActivities?: Array<{
    event_id: string;
    changed_at: string;
    description: string;
    change_type: "Ekleme" | "Güncelleme" | "Silme";
    column_name: string;
    old_value: string;
    new_value: string;
  }>;
}

function StatCard({
  title,
  value,
  maxValue,
  suffix = "",
  displayValue,
  actionLink,
  description,
  icon: Icon,
  type = "default",
}: StatCardProps) {
  // If maxValue is not provided, just show the value without progress bar
  if (!maxValue) {
    return (
      <div className="p-6">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className={`rounded-lg p-2 ${
              type === "warning" 
                ? "bg-[#FCEFEF] text-[#D22D2D]" 
                : "bg-[#F0FBF1] text-[#39C645]"
            }`}>
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="text-2xl font-bold">
              {value.toLocaleString("tr-TR")}
              {suffix && <span>{suffix}</span>}
            </div>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const percentage = Math.round((value / maxValue) * 100);
  const displayPercentage = displayValue ? Math.round((displayValue / maxValue) * 100) : percentage;

  // Get progress colors based on percentage
  const getProgressColors = (percentage: number) => {
    if (percentage < 25) {
      return {
        progressColor: "#D22D2D",
        progressBgColor: "#FCEFEF",
      };
    } else if (percentage < 75) {
      return {
        progressColor: "#F9BC06",
        progressBgColor: "#FFFAEC",
      };
    } else {
      return {
        progressColor: "#39C645",
        progressBgColor: "#F0FBF1",
      };
    }
  };

  const { progressColor, progressBgColor } = getProgressColors(displayPercentage);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        {actionLink && (
          <Link
            href={actionLink.href}
            className="text-sm text-muted-foreground hover:underline"
          >
            {actionLink.text}
          </Link>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-baseline">
          <div className="text-2xl font-bold">
            {value.toLocaleString("tr-TR")}
            {suffix && <span>{suffix}</span>}
          </div>
          <div className="text-sm text-muted-foreground ml-1">/ {maxValue.toLocaleString("tr-TR")}{suffix}</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Progress
          value={displayPercentage}
          className={`h-2 flex-1 transition-all`}
          style={{
            '--progress-background': progressBgColor,
            '--progress-foreground': progressColor,
            background: 'var(--progress-background)',
          } as React.CSSProperties}
        />
        <span className="text-sm font-medium text-muted-foreground">
          %{displayPercentage}
        </span>
      </div>
    </div>
  );
}

export function CustomStatistics(props: StatCardProps | ShareholderStatsProps) {
  // Check if this is a ShareholderStatsProps by looking for the stats property
  if ('stats' in props) {
    const { stats, recentActivities } = props;
    return (
      <div className="grid gap-8">
        {/* Stats Grid */}
        <div className="grid gap-16 md:grid-cols-2">
          <div>
            <StatCard
              title="Eksik Kaporalar"
              value={stats.missingDeposits}
              maxValue={stats.totalShareholders}
              actionLink={{
                text: "Tümünü göster",
                href: "/kurban-admin/odeme-analizi?tab=eksik-kapora",
              }}
            />
          </div>
          <div>
            <StatCard
              title="Eksik Ödemeler"
              value={stats.missingPayments}
              maxValue={stats.totalShareholders}
              actionLink={{
                text: "Tümünü göster",
                href: "/kurban-admin/odeme-analizi?tab=eksik-odeme",
              }}
            />
          </div>
        </div>

        {/* Recent Activities */}
        {recentActivities && (
          <Card className="shadow-none">
            <div className="p-6">
              <h3 className="font-semibold">Son Hissedar İşlemleri</h3>
              <ScrollArea className="h-[400px] mt-6">
                <div className="relative space-y-6">
                  {recentActivities.map((log, index, array) => (
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
                            {getCustomDescription(log)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // If it's not a ShareholderStatsProps, it must be a StatCardProps
  return <StatCard {...props} />;
}

// Helper function to get custom description
function getCustomDescription(log: {
  event_id: string;
  changed_at: string;
  description: string;
  change_type: "Ekleme" | "Güncelleme" | "Silme";
  column_name: string;
  old_value: string;
  new_value: string;
}) {
  if (!log) return "";
  
  if (log.change_type === "Ekleme") {
    return "Hisse alımı gerçekleştirildi";
  }

  if (log.column_name === "Ödenen Tutar") {
    const newValue = parseInt(log.new_value);
    const oldValue = parseInt(log.old_value);
    return `Yapılan ödeme miktarı ${oldValue.toLocaleString('tr-TR')} TL'den ${newValue.toLocaleString('tr-TR')} TL'ye yükseldi.`;
  }

  if (log.column_name === "Teslimat Noktası") {
    const oldLocation = formatLocationName(log.old_value);
    const newLocation = formatLocationName(log.new_value);
    return `Hisse teslimi ${oldLocation} yerine ${newLocation}'nda yapılacak.`;
  }

  return log.description;
}

// Helper function to format location name
function formatLocationName(location: string) {
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
} 