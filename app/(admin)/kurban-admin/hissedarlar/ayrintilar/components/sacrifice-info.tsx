"use client";

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

  return (
    <div className={sectionClass}>
      <h3 className="text-lg md:text-xl font-semibold mb-4">Kurbanlık Bilgileri</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className={labelClass}>Kurban Sırası</p>
          <p className={valueClass}>
            {shareholderInfo.sacrifice?.sacrifice_no || "-"}
          </p>
        </div>
        <div className="space-y-1">
          <p className={labelClass}>Kesim Saati</p>
          <p className={valueClass}>
            {formatSacrificeTime(shareholderInfo.sacrifice?.sacrifice_time)}
          </p>
        </div>
        <div className="space-y-1">
          <p className={labelClass}>Hisse Bedeli</p>
          <p className={valueClass}>
            {new Intl.NumberFormat('tr-TR').format(shareholderInfo.sacrifice?.share_price || 0)} TL
          </p>
        </div>
        <div className="space-y-1">
          <p className={labelClass}>Tahmini Et Ağırlığı</p>
          <p className={valueClass}>
            {shareholderInfo.sacrifice?.share_weight
              ? `${shareholderInfo.sacrifice.share_weight} kg`
              : "-"}
          </p>
        </div>
      </div>
    </div>
  );
} 