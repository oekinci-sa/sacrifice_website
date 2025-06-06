import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

// Define the expected structure for a single shareholder
interface ShareholderInput {
  shareholder_name: string;
  phone_number: string;
  transaction_id: string;
  sacrifice_id: string;
  share_price: number;
  delivery_fee?: number; // Optional
  delivery_location: string;
  security_code: string;
  purchased_by: string;
  last_edited_by: string;
  sacrifice_consent?: boolean; // Optional
  total_amount: number; // Total amount to be paid
  remaining_payment: number; // Remaining payment amount
}

export async function POST(req: Request) {
  try {
    // Expecting an array of shareholders
    const shareholdersData: ShareholderInput[] = await req.json();

    if (!Array.isArray(shareholdersData) || shareholdersData.length === 0) {
      return NextResponse.json(
        { error: "Shareholder data must be a non-empty array" },
        { status: 400 }
      );
    }

    // Optional: Add validation for each shareholder object here if needed
    // e.g., check for required fields, data types, etc.

    const { data, error } = await supabaseAdmin
      .from("shareholders")
      .insert(shareholdersData) // Insert the array of shareholder objects
      .select(); // Select the inserted data to confirm

    if (error) {
      return NextResponse.json(
        { error: "Failed to create shareholders", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 }); // 201 Created

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
} 