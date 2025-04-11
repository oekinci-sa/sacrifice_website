import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// This is a server-side API endpoint (Route Handler)
// It will be accessible at /api/update-sacrifice-share
export async function POST(request: NextRequest) {
  try {
    // Parse the request body to get sacrificeId and emptyShare
    const { sacrificeId, emptyShare } = await request.json();

    // Validate input
    if (!sacrificeId) {
      return NextResponse.json(
        { error: "sacrifice_id is required" },
        { status: 400 }
      );
    }

    if (typeof emptyShare !== 'number') {
      return NextResponse.json(
        { error: "empty_share must be a number" },
        { status: 400 }
      );
    }

    // Use the supabaseAdmin client with service role to update data
    const { data, error } = await supabaseAdmin
      .from("sacrifice_animals")
      .update({ empty_share: emptyShare })
      .eq("sacrifice_id", sacrificeId)
      .select();

    if (error) {
      console.error('Error updating sacrifice animal:', error);
      return NextResponse.json(
        { error: "Failed to update sacrifice animal" },
        { status: 500 }
      );
    }

    // Return the updated data
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 