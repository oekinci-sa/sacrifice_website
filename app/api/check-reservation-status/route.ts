import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

// This endpoint checks the status of a reservation and returns expiration details
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const transaction_id = searchParams.get('transaction_id');

    if (!transaction_id) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    // Use the supabaseAdmin client with service role to fetch data (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from("reservation_transactions")
      .select("*")
      .eq("transaction_id", transaction_id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch reservation status" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Calculate time remaining if expires_at exists
    let timeRemaining = null;
    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      timeRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000)); // seconds
    }

    // Return the status and expiration info
    return NextResponse.json({
      status: data.status,
      transaction_id: data.transaction_id,
      sacrifice_id: data.sacrifice_id,
      share_count: data.share_count,
      expires_at: data.expires_at,
      timeRemaining: timeRemaining, // Seconds remaining until expiration
      created_at: data.created_at,
      updated_at: data.updated_at
    });
  } catch (error) {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 