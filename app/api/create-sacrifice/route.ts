import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const sacrificeData = await request.json();

        // Gerekli alanları kontrol et
        if (!sacrificeData.sacrifice_no || !sacrificeData.share_price || !sacrificeData.share_weight) {
            return NextResponse.json(
                { error: 'Gerekli alanlar eksik' },
                { status: 400 }
            );
        }

        // Generate sacrifice_id based on sacrifice_no
        const sacrifice_id = `SAC${sacrificeData.sacrifice_no}`;

        // Use supabaseAdmin client instead of createRouteHandlerClient to bypass RLS
        const { data, error } = await supabaseAdmin
            .from('sacrifice_animals')
            .insert([
                {
                    sacrifice_id: sacrifice_id,
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