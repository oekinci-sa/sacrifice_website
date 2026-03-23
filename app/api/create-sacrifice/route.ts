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

        const { data, error } = await supabaseAdmin.rpc('rpc_create_sacrifice', {
            p_actor: actor,
            p_tenant_id: tenantId,
            p_sacrifice_year: sacrificeYear,
            p_sacrifice_no: sacrificeData.sacrifice_no,
            p_sacrifice_time: sacrificeData.sacrifice_time,
            p_share_weight: sacrificeData.share_weight,
            p_share_price: sacrificeData.share_price,
            p_empty_share: sacrificeData.empty_share ?? 7,
            p_animal_type: sacrificeData.animal_type ?? null,
            p_notes: sacrificeData.notes ?? null,
        });

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