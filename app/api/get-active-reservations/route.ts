import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

// Dynamic route handler (no caching)
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
    try {
        // Supabase ile aktif ("active" statüslü) rezervasyonları çek
        const { data, error } = await supabaseAdmin
            .from('reservation_transactions')
            .select('sacrifice_id, share_count')
            .eq('status', 'active');

        if (error) {
            return NextResponse.json(
                { error: "Aktif rezervasyonlar alınamadı" },
                {
                    status: 500,
                    headers: {
                        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                }
            );
        }

        // Sacrifice_id'ye göre toplam aktif hisse sayısını hesapla
        const sacrificeMap: Record<string, number> = {};

        data.forEach((reservation) => {
            const { sacrifice_id, share_count } = reservation;

            if (!sacrificeMap[sacrifice_id]) {
                sacrificeMap[sacrifice_id] = 0;
            }

            sacrificeMap[sacrifice_id] += share_count;
        });

        // Dönüş formatı: [{ sacrifice_id: "...", active_count: 3 }, ...]
        const result = Object.entries(sacrificeMap).map(([sacrifice_id, active_count]) => ({
            sacrifice_id,
            active_count
        }));

        return NextResponse.json(result, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (error) {
        console.error('Aktif rezervasyonlar alınırken hata:', error);
        return NextResponse.json(
            { error: "Beklenmeyen bir hata oluştu" },
            {
                status: 500,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            }
        );
    }
} 