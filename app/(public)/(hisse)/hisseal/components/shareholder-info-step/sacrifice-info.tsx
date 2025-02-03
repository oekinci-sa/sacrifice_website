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
    <div className="flex items-center justify-between px-4 py-6 overflow-x-auto min-w-full whitespace-nowrap">
      <div className="flex items-center flex-shrink-0">
        <span className="text-muted-foreground">Kurban No:</span>
        <span className="ml-2 font-medium">{sacrifice.sacrifice_no}</span>
      </div>
      <div className="w-px h-6 bg-gray-300 flex-shrink-0 mx-4" />
      <div className="flex items-center flex-shrink-0">
        <span className="text-muted-foreground">Kesim Saati:</span>
        <span className="ml-2 font-medium">{formatTime(sacrifice.sacrifice_time)}</span>
      </div>
      <div className="w-px h-6 bg-gray-300 flex-shrink-0 mx-4" />
      <div className="flex items-center flex-shrink-0">
        <span className="text-muted-foreground">Hisse Bedeli:</span>
        <span className="ml-2 font-medium">{sacrifice.share_price} ₺</span>
      </div>
      <div className="w-px h-6 bg-gray-300 flex-shrink-0 mx-4" />
      <div className="flex items-center flex-shrink-0">
        <span className="text-muted-foreground">Kalan Hisse:</span>
        <span className="ml-2 font-medium">{currentSacrifice?.empty_share ?? sacrifice.empty_share}</span>
      </div>
    </div>
  )
} 