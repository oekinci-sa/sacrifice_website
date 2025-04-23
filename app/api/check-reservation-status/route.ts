import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

// This endpoint checks the status of a reservation and returns expiration details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
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
      .select("status, expires_at, created_at")
      .eq("transaction_id", transaction_id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
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
    let timeLeftSeconds = 0;
    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      timeLeftSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000)); // seconds
    }

    // Return only the necessary fields
    return NextResponse.json({
      status: data.status,
      expires_at: data.expires_at,
      created_at: data.created_at,
      timeLeftSeconds: timeLeftSeconds,
      currentTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Reservation status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check reservation status' },
      { status: 500 }
    );
  }
} 