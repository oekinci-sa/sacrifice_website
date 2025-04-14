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
    <div className="grid grid-cols-2 md:flex md:items-center md:justify-center px-4 min-w-full whitespace-nowrap gap-4 md:gap-0">
      <div className="flex items-center flex-shrink-0">
        <span className="text-muted-foreground text-xs md:text-xl">Kurbanlık Sırası:</span>
        <span className="ml-2 font-medium text-xs md:text-xl">{sacrifice.sacrifice_no}</span>
      </div>
      <div className="hidden md:block w-px h-6 bg-gray-300 flex-shrink-0 mx-4" />
      <div className="flex items-center flex-shrink-0">
        <span className="text-muted-foreground text-xs md:text-xl">Kesim Saati:</span>
        <span className="ml-2 font-medium text-xs md:text-xl">{formatTime(sacrifice.sacrifice_time)}</span>
      </div>
      <div className="hidden md:block w-px h-6 bg-gray-300 flex-shrink-0 mx-4" />
      <div className="flex items-center flex-shrink-0">
        <span className="text-muted-foreground text-xs md:text-xl">Hisse Bedeli:</span>
        <span className="ml-2 font-medium text-xs md:text-xl">{sacrifice.share_price} ₺</span>
      </div>
      <div className="hidden md:block w-px h-6 bg-gray-300 flex-shrink-0 mx-4" />
      <div className="flex items-center flex-shrink-0">
        <span className="text-muted-foreground text-xs md:text-xl">Kalan Hisse:</span>
        <span className="ml-2 font-medium text-xs md:text-xl">{currentSacrifice?.empty_share ?? sacrifice.empty_share}</span>
      </div>
    </div>
  )
} 