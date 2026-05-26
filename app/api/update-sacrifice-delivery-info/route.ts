import { authOptions } from '@/lib/auth';
import {
    getSessionActorEmail,
    TAKIP_EKRANI_ACTOR,
} from '@/lib/admin-editor-session';
import { parseDecimalInput } from '@/lib/decimal-input';
import { getDefaultSacrificeYear } from '@/lib/constants/sacrifice-year';
import { getTenantId } from '@/lib/tenant';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
};

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const actor = getSessionActorEmail(session) ?? TAKIP_EKRANI_ACTOR;

        const tenantId = getTenantId();
        const sacrificeYear = getDefaultSacrificeYear();
        const body = await request.json();
        const { sacrifice_no, delivered_share_kg, delivery_notes } = body;

        if (!sacrifice_no) {
            return NextResponse.json(
                { error: "sacrifice_no gerekli" },
                { status: 400, headers: NO_STORE_HEADERS }
            );
        }

        const sacrificeNoInt = parseInt(String(sacrifice_no), 10);
        if (isNaN(sacrificeNoInt) || sacrificeNoInt <= 0) {
            return NextResponse.json(
                { error: "sacrifice_no geçersiz" },
                { status: 400, headers: NO_STORE_HEADERS }
            );
        }

        if (delivered_share_kg !== undefined && delivered_share_kg !== null && delivered_share_kg !== '') {
            const kg = parseDecimalInput(delivered_share_kg);
            if (kg === null || kg < 0) {
                return NextResponse.json(
                    { error: "Teslim edilen kg geçersiz" },
                    { status: 400, headers: NO_STORE_HEADERS }
                );
            }
        }

        const { data: animalRow, error: resolveError } = await supabaseAdmin
            .from("sacrifice_animals")
            .select("sacrifice_id")
            .eq("tenant_id", tenantId)
            .eq("sacrifice_no", sacrificeNoInt)
            .eq("sacrifice_year", sacrificeYear)
            .single();

        if (resolveError || !animalRow) {
            return NextResponse.json(
                { error: "Kurban kaydı bulunamadı" },
                { status: 404, headers: NO_STORE_HEADERS }
            );
        }

        const now = new Date().toISOString();
        const patch: Record<string, unknown> = {
            last_edited_by: actor,
            last_edited_time: now,
        };

        if (delivered_share_kg !== undefined) {
            patch.delivered_share_kg = parseDecimalInput(delivered_share_kg);
        }

        if (delivery_notes !== undefined) {
            patch.delivery_notes =
                delivery_notes === null || delivery_notes === ''
                    ? null
                    : String(delivery_notes);
        }

        const { data, error } = await supabaseAdmin.rpc('rpc_update_sacrifice_core', {
            p_actor: actor,
            p_tenant_id: tenantId,
            p_sacrifice_id: animalRow.sacrifice_id,
            p_sacrifice_year: sacrificeYear,
            p_patch: patch,
        });

        if (error) {
            console.error('rpc_update_sacrifice_core (delivery info)', error);
            return NextResponse.json(
                { error: "Teslimat bilgisi güncellenemedi" },
                { status: 500, headers: NO_STORE_HEADERS }
            );
        }

        const list = data as Record<string, unknown>[] | null;
        if (!list || list.length === 0) {
            return NextResponse.json(
                { error: "Kurban kaydı bulunamadı" },
                { status: 404, headers: NO_STORE_HEADERS }
            );
        }

        return NextResponse.json(list[0], { headers: NO_STORE_HEADERS });
    } catch {
        return NextResponse.json(
            { error: "Beklenmeyen bir sunucu hatası oluştu" },
            { status: 500, headers: NO_STORE_HEADERS }
        );
    }
}
