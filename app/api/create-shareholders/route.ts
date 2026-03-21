import { authOptions } from '@/lib/auth';
import { getSessionActorEmail, HISSE_AL_AKISI_ACTOR } from '@/lib/admin-editor-session';
import { getTenantId } from '@/lib/tenant';
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { formatPhoneForDB } from "@/utils/formatters";
import { getServerSession } from 'next-auth';
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
  /** İstemci gönderebilir; sunucu yok sayar (Faz 1: oturum veya hisseal-akisi). */
  last_edited_by?: string;
  sacrifice_consent?: boolean; // Optional
  total_amount: number; // Total amount to be paid (share_price + delivery_fee)
  remaining_payment: number; // Remaining payment amount
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const actor = getSessionActorEmail(session) ?? HISSE_AL_AKISI_ACTOR;

    const tenantId = getTenantId();
    const shareholdersData: ShareholderInput[] = await req.json();

    if (!Array.isArray(shareholdersData) || shareholdersData.length === 0) {
      return NextResponse.json(
        { error: "Shareholder data must be a non-empty array" },
        { status: 400 }
      );
    }

    const sacrificeIds = Array.from(new Set(shareholdersData.map((s) => s.sacrifice_id)));
    const { data: sacrifices } = await supabaseAdmin
      .from("sacrifice_animals")
      .select("sacrifice_id, sacrifice_year")
      .in("sacrifice_id", sacrificeIds)
      .eq("tenant_id", tenantId);

    const sacrificeYearMap = new Map(
      (sacrifices ?? []).map((s) => [s.sacrifice_id, s.sacrifice_year])
    );

    const shareholdersWithTenant = shareholdersData.map((s) => {
      const sacrificeYear = sacrificeYearMap.get(s.sacrifice_id);
      if (sacrificeYear == null) {
        throw new Error(`Sacrifice ${s.sacrifice_id} not found`);
      }
      const {
        share_price: _sharePrice,
        second_phone_number: secondPhone,
        last_edited_by: _ignoredLastEdited,
        ...rest
      } = s as ShareholderInput & { share_price?: number };
      void _sharePrice;
      void _ignoredLastEdited;
      const row: Record<string, unknown> = {
        ...rest,
        last_edited_by: actor,
        tenant_id: tenantId,
        sacrifice_year: sacrificeYear,
      };
      if (secondPhone) {
        const formatted = formatPhoneForDB(secondPhone);
        if (formatted) row.second_phone_number = formatted;
      }
      return row;
    });

    const { data, error } = await supabaseAdmin
      .from("shareholders")
      .insert(shareholdersWithTenant)
      .select(); // Select the inserted data to confirm

    if (error) {
      return NextResponse.json(
        { error: "Failed to create shareholders" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 }); // 201 Created

  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 