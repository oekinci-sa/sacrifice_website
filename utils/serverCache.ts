import { createClient } from '@supabase/supabase-js'
import NodeCache from 'node-cache'
import { cache } from 'react'

// Server-side önbellek - 10 dakika varsayılan TTL
const serverCache = new NodeCache({ stdTTL: 600 })

// Supabase istemcisi
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// Önbellek anahtarları
export const CACHE_KEYS = {
    SACRIFICE_ANIMALS: 'sacrifice_animals',
    EMPTY_SHARE_COUNT: 'empty_share_count',
}

// Önbelleği başlat ve Realtime aboneliğini ayarla
export async function initializeCache() {
    console.log('🔄 Server-side cache initializing...')

    // İlk veriyi çek ve önbelleğe al
    await refreshSacrificeCache()

    // Realtime aboneliği ayarla
    setupRealtimeSubscription()

    console.log('✅ Server-side cache initialized')
    return true
}

// Kurban verilerini tazele
export async function refreshSacrificeCache() {
    try {
        const { data: sacrifices, error } = await supabase
            .from('sacrifice_animals')
            .select('*')

        if (error) throw error

        // Önbelleğe al
        serverCache.set(CACHE_KEYS.SACRIFICE_ANIMALS, sacrifices)

        // Boş hisse sayılarını hesapla ve önbelleğe al
        const emptyShareCounts = calculateEmptyShareCounts(sacrifices)
        serverCache.set(CACHE_KEYS.EMPTY_SHARE_COUNT, emptyShareCounts)

        console.log('🔄 Server cache updated with latest data')
        return sacrifices
    } catch (error) {
        console.error('❌ Error refreshing cache:', error)
        return null
    }
}

// Boş hisse sayılarını hesapla
function calculateEmptyShareCounts(sacrifices: any[]) {
    return sacrifices.reduce((counts, sacrifice) => {
        const { share_price } = sacrifice
        if (!counts[share_price]) {
            counts[share_price] = 0
        }
        counts[share_price] += sacrifice.empty_share || 0
        return counts
    }, {})
}

// Realtime aboneliği
function setupRealtimeSubscription() {
    const channel = supabase
        .channel('server-cache-channel')
        .on('postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'sacrifice_animals'
            },
            async (payload) => {
                console.log('🔴 Realtime update received on server, refreshing cache')
                await refreshSacrificeCache()
            }
        )
        .subscribe((status) => {
            console.log('Realtime subscription status:', status)
        })

    // Uygulama kapanırken aboneliği temizle
    process.on('SIGTERM', () => {
        supabase.removeChannel(channel)
    })
}

// Önbellekten veri al
export const getCachedData = (key: string) => {
    return serverCache.get(key)
}

// Veri için önbellekten al veya çek
export const getDataWithCache = cache(async (key: string, fetchFn: () => Promise<any>) => {
    // Önbellekte var mı kontrol et
    const cachedData = serverCache.get(key)
    if (cachedData) {
        return cachedData
    }

    // Yoksa çek ve önbelleğe al
    const data = await fetchFn()
    if (data) {
        serverCache.set(key, data)
    }
    return data
}) 