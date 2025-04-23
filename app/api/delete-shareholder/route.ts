import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        // Body'den gerekli bilgileri al
        const body = await request.json();
        const { shareholder_id } = body;

        if (!shareholder_id) {
            return NextResponse.json(
                { error: "Shareholder ID is required" },
                { status: 400 }
            );
        }

        // Önce hissedarın bağlı olduğu kurbanlığın ID'sini ve boş hisse sayısını al
        const { data: shareholder, error: fetchError } = await supabaseAdmin
            .from("shareholders")
            .select("sacrifice_id")
            .eq("shareholder_id", shareholder_id)
            .single();

        if (fetchError) {
            console.error("Hissedar bilgisi alınırken hata:", fetchError);
            return NextResponse.json(
                { error: "Failed to fetch shareholder data" },
                { status: 500 }
            );
        }

        const sacrificeId = shareholder?.sacrifice_id;

        // Hissedarı sil
        const { error: deleteError } = await supabaseAdmin
            .from("shareholders")
            .delete()
            .eq("shareholder_id", shareholder_id);

        if (deleteError) {
            console.error("Hissedar silinirken hata:", deleteError);
            return NextResponse.json(
                { error: "Failed to delete shareholder" },
                { status: 500 }
            );
        }

        // Eğer kurbanlık ID varsa, kurbanlığın boş hisse sayısını güncelle
        if (sacrificeId) {
            // Önce mevcut kurbanlık bilgilerini al
            const { data: sacrifice, error: sacrificeError } = await supabaseAdmin
                .from("sacrifice_animals")
                .select("empty_share")
                .eq("sacrifice_id", sacrificeId)
                .single();

            if (!sacrificeError && sacrifice) {
                // Boş hisse sayısını 1 artır (bir hissedar silindiği için)
                const newEmptyShare = sacrifice.empty_share + 1;

                // Kurbanlığı güncelle
                await supabaseAdmin
                    .from("sacrifice_animals")
                    .update({ empty_share: newEmptyShare })
                    .eq("sacrifice_id", sacrificeId);
            }
        }

        // Başarılı yanıt
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