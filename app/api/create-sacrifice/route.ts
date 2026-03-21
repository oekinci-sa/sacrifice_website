import { authOptions } from '@/lib/auth';
import { getSessionActorEmail, sessionHasAdminEditorOrSuperRole } from '@/lib/admin-editor-session';
import { getDefaultSacrificeYear } from '@/lib/constants/sacrifice-year';
import { getTenantId } from '@/lib/tenant';
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!sessionHasAdminEditorOrSuperRole(session)) {
            return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
        }

        const actor = getSessionActorEmail(session);
        if (!actor) {
            return NextResponse.json(
                { error: 'Oturumda e-posta bulunamadı.' },
                { status: 400 }
            );
        }

        const tenantId = getTenantId();
        const sacrificeYear = getDefaultSacrificeYear();
        const sacrificeData = await request.json();

        if (!sacrificeData.sacrifice_no || !sacrificeData.share_price || !sacrificeData.share_weight) {
            return NextResponse.json(
                { error: 'Gerekli alanlar eksik' },
                { status: 400 }
            );
        }

        const now = new Date().toISOString();

        // sacrifice_id DB'de UUID olarak otomatik üretilir
        // last_edited_by / last_edited_time: sunucu (Faz 1); istemci gövdesi dikkate alınmaz
        const { data, error } = await supabaseAdmin
            .from('sacrifice_animals')
            .insert([
                {
                    tenant_id: tenantId,
                    sacrifice_year: sacrificeYear,
                    sacrifice_no: sacrificeData.sacrifice_no,
                    sacrifice_time: sacrificeData.sacrifice_time,
                    share_weight: sacrificeData.share_weight,
                    share_price: sacrificeData.share_price,
                    empty_share: sacrificeData.empty_share || 7,
                    animal_type: sacrificeData.animal_type || null,
                    notes: sacrificeData.notes || null,
                    last_edited_time: now,
                    last_edited_by: actor
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