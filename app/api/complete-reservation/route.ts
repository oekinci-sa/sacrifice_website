import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { transaction_id } = await req.json();

    if (!transaction_id) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    console.log(`[API] Completing reservation for transaction_id: ${transaction_id}`);

    const { data, error } = await supabaseAdmin
      .from("reservation_transactions")
      .update({ status: "completed" })
      .eq("transaction_id", transaction_id)
      .select(); // Select to check if the update was successful

    if (error) {
      console.error("[API] Error updating reservation status:", error);
      return NextResponse.json(
        { error: "Failed to complete reservation", details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
        console.warn(`[API] No reservation found or updated for transaction_id: ${transaction_id}`);
        // Decide if this should be an error or just a warning
        return NextResponse.json(
          { error: "Reservation not found or already completed" },
          { status: 404 }
        );
    }

    console.log(`[API] Reservation completed successfully for transaction_id: ${transaction_id}`);
    return NextResponse.json({ success: true, data }, { status: 200 });

  } catch (err) {
    console.error("[API] Unexpected error completing reservation:", err);
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
} 