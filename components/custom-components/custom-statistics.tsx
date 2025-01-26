"use client";

import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface StatisticsProps {
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

export function CustomStatistics({ stats, recentActivities }: StatisticsProps) {
  return (
    <div className="grid gap-8">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        <div>
          <StatCard
            title="Vekalet Alındı"
            value={stats.consentStats.verildi}
            maxValue={stats.totalShareholders}
          />
        </div>
        <div>
          <StatCard
            title="Vekalet Alınmadı"
            value={stats.consentStats.bekliyor}
            maxValue={stats.totalShareholders}
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

// Helper function to get custom description
function getCustomDescription(log: StatisticsProps["recentActivities"][0]) {
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