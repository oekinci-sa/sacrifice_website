export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

// This is a server-side API endpoint (Route Handler)
// It will be accessible at /api/get-latest-sacrifice-share
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "Sacrifice ID is required" },
        { status: 400 }
      );
    }

    // Use the supabaseAdmin client with service role to fetch data
    const { data, error } = await supabaseAdmin
      .from("sacrifice_animals")
      .select("empty_share")
      .eq("sacrifice_id", id)
      .single();

    if (error) {
      console.error('Error fetching sacrifice empty_share:', error);
      return NextResponse.json(
        { error: "Failed to fetch sacrifice empty_share" },
        { status: 500 }
      );
    }

    // Return the data
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 