import { getTenantId } from '@/lib/tenant';
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

// Define the expected structure for a single shareholder
// share_price artık shareholders tablosunda yok, sacrifice_animals ile JOIN'den alınır
interface ShareholderInput {
  shareholder_name: string;
  phone_number: string;
  email?: string;
  transaction_id: string;
  sacrifice_id: string;
  delivery_fee?: number; // Optional
  delivery_location: string;
  delivery_type?: string; // Kesimhane | Adrese teslim | Ulus
  security_code: string;
  purchased_by: string;
  last_edited_by: string;
  sacrifice_consent?: boolean; // Optional
  total_amount: number; // Total amount to be paid (share_price + delivery_fee)
  remaining_payment: number; // Remaining payment amount
}

export async function POST(req: Request) {
  try {
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
      const { share_price: _sharePrice, ...rest } = s as ShareholderInput & { share_price?: number };
      void _sharePrice;
      return {
        ...rest,
        tenant_id: tenantId,
        sacrifice_year: sacrificeYear,
      };
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