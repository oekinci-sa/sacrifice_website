import { CACHE_KEYS, getCachedData, refreshSacrificeCache } from '@/utils/serverCache';
import { NextResponse } from 'next/server';

// ✅ Force Node.js runtime to access process.env
export const runtime = "nodejs";

// This is a server-side API endpoint (Route Handler)
// It will be accessible at /api/get-sacrifice-animals
export async function GET() {
  try {
    // Önbellekten al
    let sacrifices = getCachedData(CACHE_KEYS.SACRIFICE_ANIMALS)

    // Eğer önbellekte yoksa veya bozuksa, veritabanından çek
    if (!sacrifices) {
      sacrifices = await refreshSacrificeCache()

      // Hala veri yoksa hata döndür
      if (!sacrifices) {
        return NextResponse.json(
          { error: 'Veri çekilemedi ve önbellekte bulunamadı' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(sacrifices)
  } catch (error) {
    console.error('Kurbanlık verileri getirilirken hata:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası oluştu' },
      { status: 500 }
    )
  }
} 