"use client";

import { SacrificeMoveControl } from "../../components/sacrifice-move-control";
import { isLiveScaleSacrifice } from "@/lib/live-scale-share";
import { AdminSacrificeHisseBedeliCell } from "@/lib/admin-sacrifice-hisse-bedeli";
import { shareholderSchema } from "@/types";

interface SacrificeInfoProps {
  shareholderInfo: shareholderSchema;
  sectionClass: string;
  labelClass: string;
  valueClass: string;
}

export function SacrificeInfo({
  shareholderInfo,
  sectionClass,
  labelClass,
  valueClass
}: SacrificeInfoProps) {
  const formatSacrificeTime = (timeString: string | null | undefined) => {
    if (!timeString) return "Henüz belirlenmedi";
    try {
      // Sadece saat ve dakika bilgisini al
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes}`;
    } catch {
      return "Henüz belirlenmedi";
    }
  };

  const sac = shareholderInfo.sacrifice;
  const isLive = isLiveScaleSacrifice(sac);

  return (
    <div className={sectionClass}>
      <h3 className="text-lg md:text-xl font-semibold mb-4">Kurbanlık Bilgileri</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className={labelClass}>Kurban Sırası</p>
          <div className={valueClass}>
            <SacrificeMoveControl
              shareholder={shareholderInfo}
              selectedYear={shareholderInfo.sacrifice_year}
              layout="detail"
            />
          </div>
        </div>
        <div className="space-y-1">
          <p className={labelClass}>Kesim Saati</p>
          <p className={valueClass}>
            {formatSacrificeTime(shareholderInfo.sacrifice?.sacrifice_time)}
          </p>
        </div>
        <div className="space-y-1">
          <p className={labelClass}>Hisse Bedeli</p>
          <div className={valueClass}>
            <AdminSacrificeHisseBedeliCell sacrifice={sac} align="left" />
          </div>
        </div>
        <div className="space-y-1">
          <p className={labelClass}>
            {isLive ? "Toplam kilogram (baskül)" : "Tahmini Et Ağırlığı"}
          </p>
          <p className={valueClass}>
            {isLive ? (
              sac?.live_scale_total_kg != null ? (
                `${Number(sac.live_scale_total_kg)} kg`
              ) : (
                <span className="text-muted-foreground">Toplam kg henüz girilmedi.</span>
              )
            ) : sac?.share_weight != null ? (
              `${sac.share_weight} kg`
            ) : (
              "-"
            )}
          </p>
        </div>
      </div>
    </div>
  );
} 