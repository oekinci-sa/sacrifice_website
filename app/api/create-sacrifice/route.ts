import { getTenantId } from '@/lib/tenant';
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const tenantId = getTenantId();
        const sacrificeData = await request.json();

        if (!sacrificeData.sacrifice_no || !sacrificeData.share_price || !sacrificeData.share_weight) {
            return NextResponse.json(
                { error: 'Gerekli alanlar eksik' },
                { status: 400 }
            );
        }

        // sacrifice_id DB'de UUID olarak otomatik üretilir
        const { data, error } = await supabaseAdmin
            .from('sacrifice_animals')
            .insert([
                {
                    tenant_id: tenantId,
                    sacrifice_no: sacrificeData.sacrifice_no,
                    sacrifice_time: sacrificeData.sacrifice_time,
                    share_weight: sacrificeData.share_weight,
                    share_price: sacrificeData.share_price,
                    empty_share: sacrificeData.empty_share || 7,
                    notes: sacrificeData.notes || null,
                    last_edited_time: sacrificeData.last_edited_time || new Date().toISOString(),
                    last_edited_by: sacrificeData.last_edited_by || 'admin'
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Kurbanlık ekleme hatası:', error);
            return NextResponse.json(
                { error: 'Veritabanı hatası: ' + error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('API hatası:', error);
        return NextResponse.json(
            { error: 'İşlem sırasında bir hata oluştu' },
            { status: 500 }
        );
    }
} 