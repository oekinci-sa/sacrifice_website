"use client";

import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { sacrificeSchema } from "@/types";

interface SacrificeInfoProps {
  sacrifice: sacrificeSchema | null;
}

// Helper function to format time without seconds
const formatTime = (time: string | null) => {
  if (!time) return "Belirlenmedi";

  // Format time to remove seconds if present
  try {
    // Check if time contains seconds (HH:MM:SS)
    if (time.includes(':') && time.split(':').length > 2) {
      // Split by colon and remove seconds part
      const parts = time.split(':');
      return `${parts[0]}:${parts[1]}`;
    }
  } catch {
  }

  return time;
};

// Helper function to format price with thousand separators
const formatPrice = (price: number | null) => {
  if (!price && price !== 0) return "Belirtilmedi";

  // Format number with thousand separators
  return price.toLocaleString('tr-TR') + ' TL';
};

export default function SacrificeInfo({
  sacrifice,
}: SacrificeInfoProps) {
  // Get sacrifices from Zustand store
  const { sacrifices } = useSacrificeStore();

  // Get the most up-to-date sacrifice information from the store
  const currentSacrifice = sacrifice?.sacrifice_id
    ? sacrifices.find((s) => s.sacrifice_id === sacrifice.sacrifice_id)
    : null;

  // Use the latest data if available, otherwise fall back to the prop
  const displaySacrifice = currentSacrifice || sacrifice;

  if (!displaySacrifice) return null;

  return (
    <div className="grid grid-cols-2 justify-items-center items-center md:flex md:items-center md:justify-center px-4 min-w-full whitespace-nowrap gap-4 md:gap-0">
      {/* Kurbanlık Sırası */}
      <div className="flex items-center flex-shrink-0">
        <span className="text-muted-foreground text-base md:text-xl">
          Kurbanlık Sırası:
        </span>
        <span className="ml-2 font-medium text-base md:text-xl">
          {displaySacrifice.sacrifice_no}
        </span>
      </div>

      {/* Dik çubuk */}
      <div className="hidden md:block w-px h-6 bg-gray-300 flex-shrink-0 mx-4" />

      {/* Kesim Saati */}
      <div className="flex items-center flex-shrink-0">
        <span className="text-muted-foreground text-base md:text-xl">
          Kesim Saati:
        </span>
        <span className="ml-2 font-medium text-base md:text-xl">
          {formatTime(displaySacrifice.sacrifice_time)}
        </span>
      </div>

      {/* Dik çubuk */}
      <div className="hidden md:block w-px h-6 bg-gray-300 flex-shrink-0 mx-4" />

      {/* Hisse Bedeli */}
      <div className="flex items-center flex-shrink-0">
        <span className="text-muted-foreground text-base md:text-xl">
          Hisse Bedeli:
        </span>
        <span className="ml-2 font-medium text-base md:text-xl">
          {formatPrice(displaySacrifice.share_price)}
        </span>
      </div>

      {/* Dik çubuk */}
      <div className="hidden md:block w-px h-6 bg-gray-300 flex-shrink-0 mx-4" />

      {/* Kalan Hisse */}
      <div className="flex items-center flex-shrink-0">
        <span className="text-muted-foreground text-base md:text-xl">
          Kalan Hisse:
        </span>
        <span className="ml-2 font-medium text-base md:text-xl">
          {displaySacrifice.empty_share}
        </span>
      </div>
    </div>
  );
}
