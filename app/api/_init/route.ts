import { NextResponse } from 'next/server'
import { initializeCache } from '@/utils/serverCache'

// Sunucu başlatıldığında önbelleği başlat
let isCacheInitialized = false

export async function GET() {
  if (!isCacheInitialized) {
    isCacheInitialized = await initializeCache()
  }
  
  return NextResponse.json({
    success: true,
    initialized: isCacheInitialized,
    timestamp: new Date().toISOString()
  })
} 