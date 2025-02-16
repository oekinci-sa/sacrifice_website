"use client"

import { sacrificeSchema } from "@/types"
import { useSacrifices } from "@/hooks/useSacrifices"

interface SacrificeInfoProps {
  sacrifice: sacrificeSchema | null
}

const formatTime = (time: string | null) => {
  if (!time) return ""
  return time.split(':').slice(0, 2).join(':')
}

export default function SacrificeInfo({ sacrifice }: SacrificeInfoProps) {
  const { data: sacrifices } = useSacrifices()
  const currentSacrifice = sacrifices?.find(s => s.sacrifice_id === sacrifice?.sacrifice_id)

  if (!sacrifice) return null

  return (
    <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-between px-4 py-6 overflow-x-auto min-w-full whitespace-nowrap gap-4 sm:gap-0">
      <div className="flex items-center flex-shrink-0">
        <span className="text-muted-foreground text-xs sm:text-base">Kurbanlık Sırası:</span>
        <span className="ml-2 font-medium text-xs sm:text-base">{sacrifice.sacrifice_no}</span>
      </div>
      <div className="hidden sm:block w-px h-6 bg-gray-300 flex-shrink-0 mx-4" />
      <div className="flex items-center flex-shrink-0">
        <span className="text-muted-foreground text-xs sm:text-base">Kesim Saati:</span>
        <span className="ml-2 font-medium text-xs sm:text-base">{formatTime(sacrifice.sacrifice_time)}</span>
      </div>
      <div className="hidden sm:block w-px h-6 bg-gray-300 flex-shrink-0 mx-4" />
      <div className="flex items-center flex-shrink-0">
        <span className="text-muted-foreground text-xs sm:text-base">Hisse Bedeli:</span>
        <span className="ml-2 font-medium text-xs sm:text-base">{sacrifice.share_price} ₺</span>
      </div>
      <div className="hidden sm:block w-px h-6 bg-gray-300 flex-shrink-0 mx-4" />
      <div className="flex items-center flex-shrink-0">
        <span className="text-muted-foreground text-xs sm:text-base">Kalan Hisse:</span>
        <span className="ml-2 font-medium text-xs sm:text-base">{currentSacrifice?.empty_share ?? sacrifice.empty_share}</span>
      </div>
    </div>
  )
} 