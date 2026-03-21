import { authOptions } from '@/lib/auth';
import { getSessionActorEmail, sessionHasAdminEditorOrSuperRole } from '@/lib/admin-editor-session';
import { getTenantId } from '@/lib/tenant';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getServerSession } from 'next-auth';
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!sessionHasAdminEditorOrSuperRole(session)) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }

        const actor = getSessionActorEmail(session);
        if (!actor) {
            return NextResponse.json(
                { error: "Oturumda e-posta bulunamadı." },
                { status: 400 }
            );
        }

        const tenantId = getTenantId();
        const body = await request.json();
        const { shareholder_id } = body;

        if (!shareholder_id) {
            return NextResponse.json(
                { error: "Shareholder ID is required" },
                { status: 400 }
            );
        }

        const { error: deleteError } = await supabaseAdmin.rpc("rpc_delete_shareholder", {
            p_actor: actor,
            p_tenant_id: tenantId,
            p_shareholder_id: shareholder_id,
        });

        if (deleteError) {
            console.error("Hissedar silinirken hata:", deleteError);
            return NextResponse.json(
                { error: "Hissedar silinemedi" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            deleted: true,
            shareholder_id
        });
    } catch (error) {
        console.error("Silme işlemi sırasında hata:", error);
        return NextResponse.json(
            { error: "Beklenmeyen bir sunucu hatası oluştu" },
            { status: 500 }
        );
    }
} 