import { HISSE_AL_AKISI_ACTOR } from '@/lib/admin-editor-session';
import { getTenantId } from '@/lib/tenant';
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { formatPhoneForDB } from "@/utils/formatters";
import { NextResponse } from "next/server";

// Define the expected structure for a single shareholder
// share_price artık shareholders tablosunda yok, sacrifice_animals ile JOIN'den alınır
interface ShareholderInput {
  shareholder_name: string;
  phone_number: string;
  second_phone_number?: string;
  email?: string;
  transaction_id: string;
  sacrifice_id: string;
  delivery_fee?: number; // Optional
  delivery_location: string;
  delivery_type?: string; // Kesimhane | Adrese teslim | Ulus
  security_code: string;
  purchased_by: string;
  /** İstemci gönderebilir; sunucu yok sayar; audit aktörü sabit "Hisse al akışı". */
  last_edited_by?: string;
  sacrifice_consent?: boolean; // Optional
  total_amount: number; // Total amount to be paid (share_price + delivery_fee)
  remaining_payment: number; // Remaining payment amount
}

export async function POST(req: Request) {
  try {
    /** Oturumdaki admin e-postası kullanılmaz: hisse al checkout ile boş hisse (DB) aynı aktör etiketini kullanır. */
    const actor = HISSE_AL_AKISI_ACTOR;

    const tenantId = getTenantId();
    const shareholdersData: ShareholderInput[] = await req.json();

    if (!Array.isArray(shareholdersData) || shareholdersData.length === 0) {
      return NextResponse.json(
        { error: "Hissedar verisi boş olamaz" },
        { status: 400 }
      );
    }

    const pRows = shareholdersData.map((s) => {
      const {
        share_price: _sharePrice,
        second_phone_number: secondPhone,
        last_edited_by: _ignoredLastEdited,
        ...rest
      } = s as ShareholderInput & { share_price?: number };
      void _sharePrice;
      void _ignoredLastEdited;

      const row: Record<string, unknown> = { ...rest };
      if (secondPhone) {
        const formatted = formatPhoneForDB(secondPhone);
        if (formatted) row.second_phone_number = formatted;
      }
      return row;
    });

    const { data, error } = await supabaseAdmin.rpc("rpc_insert_shareholders_batch", {
      p_actor: actor,
      p_tenant_id: tenantId,
      p_rows: pRows,
    });

    if (error) {
      const msg = error.message ?? "";
      if (msg.includes("already_inserted")) {
        // Idempotency: aynı transaction_id ile daha önce hissedar eklenmiş
        return NextResponse.json(
          { error: "Bu rezervasyon için hissedarlar zaten kaydedilmiş" },
          { status: 409 }
        );
      }
      if (msg.includes("invalid_sacrifice_or_tenant")) {
        return NextResponse.json(
          { error: "Geçersiz kurban veya tenant eşleşmesi" },
          { status: 400 }
        );
      }
      if (msg.includes("rows_required")) {
        return NextResponse.json(
          { error: "Hissedar verisi gerekli" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Hissedarlar oluşturulamadı" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 }); // 201 Created

  } catch {
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
