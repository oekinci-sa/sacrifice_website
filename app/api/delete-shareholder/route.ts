import { getTenantId } from '@/lib/tenant';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const tenantId = getTenantId();
        const body = await request.json();
        const { shareholder_id } = body;

        if (!shareholder_id) {
            return NextResponse.json(
                { error: "Shareholder ID is required" },
                { status: 400 }
            );
        }

        // Hissedarı sil - empty_share güncellemesi DB trigger (trg_shareholder_delete) ile yapılır
        const { error: deleteError } = await supabaseAdmin
            .from("shareholders")
            .delete()
            .eq("tenant_id", tenantId)
            .eq("shareholder_id", shareholder_id);

        if (deleteError) {
            console.error("Hissedar silinirken hata:", deleteError);
            return NextResponse.json(
                { error: "Failed to delete shareholder" },
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
            { error: "An unexpected error occurred" },
            { status: 500 }
        );
    }
} 