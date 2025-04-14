"use client"

import { sacrificeSchema } from "@/types"
import { useHisseStore } from "@/stores/useHisseStore"

interface SacrificeInfoProps {
  sacrifice: sacrificeSchema | null
  formData: any[]
}

// Helper function to format time
const formatTime = (time: string | null) => {
  if (!time) return "Belirlenmedi";
  // Simple time formatting, can be enhanced later
  return time;
};

export default function SacrificeInfo({ sacrifice, formData }: SacrificeInfoProps) {
  // Get sacrifices from Zustand store instead of React Query
  const { sacrifices, isLoadingSacrifices, isInitialized } = useHisseStore()
  
  // Get the most up-to-date sacrifice information from the store
  // Only try to find in store if we know store is ready
  const currentSacrifice = (sacrifice?.sacrifice_id && isInitialized && !isLoadingSacrifices)
    ? sacrifices.find(s => s.sacrifice_id === sacrifice.sacrifice_id) 
    : null
    
  const shareCount = formData?.length || 0
  
  // Use the latest data if available, otherwise fall back to the prop
  const displaySacrifice = currentSacrifice || sacrifice
  
  if (!displaySacrifice) return null

  return (
    <div className="grid grid-cols-2 md:flex md:items-center md:justify-center px-4 min-w-full whitespace-nowrap gap-4 md:gap-0">
      <div className="flex items-center flex-shrink-0">
        <span className="text-muted-foreground text-xs md:text-xl">Kurbanlık Sırası:</span>
        <span className="ml-2 font-medium text-xs md:text-xl">{displaySacrifice.sacrifice_no}</span>
      </div>
      <div className="hidden md:block w-px h-6 bg-gray-300 flex-shrink-0 mx-4" />
      <div className="flex items-center flex-shrink-0">
        <span className="text-muted-foreground text-xs md:text-xl">Kesim Saati:</span>
        <span className="ml-2 font-medium text-xs md:text-xl">{formatTime(displaySacrifice.sacrifice_time)}</span>
      </div>
      <div className="hidden md:block w-px h-6 bg-gray-300 flex-shrink-0 mx-4" />
      <div className="flex items-center flex-shrink-0">
        <span className="text-muted-foreground text-xs md:text-xl">Hisse Bedeli:</span>
        <span className="ml-2 font-medium text-xs md:text-xl">{displaySacrifice.share_price} ₺</span>
      </div>
      <div className="hidden md:block w-px h-6 bg-gray-300 flex-shrink-0 mx-4" />
      <div className="flex items-center flex-shrink-0">
        <span className="text-muted-foreground text-xs md:text-xl">Kalan Hisse:</span>
        <span className="ml-2 font-medium text-xs md:text-xl">{displaySacrifice.empty_share}</span>
      </div>
    </div>
  )
} 