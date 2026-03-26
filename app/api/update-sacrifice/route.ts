import { authOptions } from '@/lib/auth';
import { getSessionActorEmail, sessionHasAdminEditorOrSuperRole } from '@/lib/admin-editor-session';
import { getDefaultSacrificeYear } from '@/lib/constants/sacrifice-year';
import { getTenantId } from '@/lib/tenant';
import { buildEmailToEditorDisplayMap, editorDisplayFromRaw } from '@/lib/resolve-editor-display';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
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

        // Parse request body
        const body = await request.json();
        const {
            sacrifice_id,
            sacrifice_no,
            sacrifice_time,
            share_weight,
            share_price,
            empty_share,
            animal_type,
            foundation,
            notes,
            ear_tag,
            last_edited_time,
            sacrifice_year: bodyYear
        } = body;

        if (!sacrifice_id) {
            return NextResponse.json({ error: 'sacrifice_id gerekli' }, { status: 400 });
        }

        const tenantId = getTenantId();
        const sacrificeYear = bodyYear != null ? Number(bodyYear) : getDefaultSacrificeYear();

        const patch: Record<string, unknown> = {
            last_edited_by: actor,
            last_edited_time: last_edited_time ?? new Date().toISOString(),
        };
        if (sacrifice_no !== undefined) patch.sacrifice_no = sacrifice_no;
        if (sacrifice_time !== undefined) patch.sacrifice_time = sacrifice_time;
        if (share_weight !== undefined) patch.share_weight = share_weight;
        if (share_price !== undefined) patch.share_price = share_price;
        if (empty_share !== undefined) patch.empty_share = empty_share;
        if (animal_type !== undefined) patch.animal_type = animal_type === "" ? null : animal_type;
        if (foundation !== undefined) {
            if (foundation === null) {
                patch.foundation = null;
            } else if (typeof foundation === "string") {
                const t = foundation.trim();
                if (t === "") {
                    patch.foundation = null;
                } else if (t === "AKV" || t === "İMH" || t === "AGD") {
                    patch.foundation = t;
                } else {
                    return NextResponse.json(
                        { error: "Vakıf yalnızca AKV, İMH veya AGD olabilir (veya boş)." },
                        { status: 400 }
                    );
                }
            } else {
                return NextResponse.json(
                    { error: "Vakıf alanı geçersiz." },
                    { status: 400 }
                );
            }
        }
        if (notes !== undefined) patch.notes = notes;
        if (ear_tag !== undefined) {
            if (ear_tag === null || ear_tag === "") {
                patch.ear_tag = null;
            } else if (typeof ear_tag === "string") {
                const t = ear_tag.trim();
                patch.ear_tag = t === "" ? null : t;
            } else {
                return NextResponse.json({ error: "Küpe no geçersiz." }, { status: 400 });
            }
        }

        const { data: rows, error } = await supabaseAdmin.rpc('rpc_update_sacrifice_core', {
            p_actor: actor,
            p_tenant_id: tenantId,
            p_sacrifice_id: sacrifice_id,
            p_sacrifice_year: sacrificeYear,
            p_patch: patch,
        });

        if (error) {
            console.error('rpc_update_sacrifice_core', error);
            return NextResponse.json(
                { error: 'Kurban kaydı güncellenemedi' },
                { status: 500 }
            );
        }

        const list = rows as Record<string, unknown>[] | null;
        if (!list || list.length === 0) {
            return NextResponse.json({ error: 'Kurban kaydı bulunamadı' }, { status: 404 });
        }

        const row = list[0];
        const displayMap = await buildEmailToEditorDisplayMap(supabaseAdmin, [
            row.last_edited_by as string | null,
        ]);
        const dataWithDisplay = {
            ...row,
            last_edited_by_display: editorDisplayFromRaw(
                row.last_edited_by as string | null,
                displayMap
            ),
        };

        return NextResponse.json({
            success: true,
            message: 'Kurban kaydı güncellendi',
            data: dataWithDisplay,
        });
    } catch (error) {
        console.error('Error updating sacrifice:', error);
        return NextResponse.json(
            { error: 'Kurban kaydı güncellenemedi' },
            { status: 500 }
        );
    }
} 