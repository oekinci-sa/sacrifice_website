import { CACHE_KEYS, getCachedData, refreshSacrificeCache } from '@/utils/serverCache'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Önbellekten al
    let emptyCounts = getCachedData(CACHE_KEYS.EMPTY_SHARE_COUNT)

    // Eğer önbellekte yoksa veya bozuksa, veritabanından çek
    if (!emptyCounts) {
      await refreshSacrificeCache()
      emptyCounts = getCachedData(CACHE_KEYS.EMPTY_SHARE_COUNT)

      // Hala veri yoksa hata döndür
      if (!emptyCounts) {
        return NextResponse.json(
          { error: 'Veri çekilemedi ve önbellekte bulunamadı' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(emptyCounts)
  } catch (error) {
    console.error('Boş hisse sayıları getirilirken hata:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası oluştu' },
      { status: 500 }
    )
  }
} 