import { getTenantId } from '@/lib/tenant';
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const tenantId = getTenantId();
    const { transaction_id } = await req.json();

    if (!transaction_id) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    // status = 'active' koşulu: terminal durumdaki rezervasyon tamamlanamaz
    const { data, error } = await supabaseAdmin
      .from("reservation_transactions")
      .update({ status: "completed" })
      .eq("tenant_id", tenantId)
      .eq("transaction_id", transaction_id)
      .eq("status", "active")
      .select();

    if (error) {
      return NextResponse.json(
        { error: "Failed to complete reservation" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Reservation not found or not in active state" },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });

  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 