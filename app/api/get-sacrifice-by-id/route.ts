import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// This is a server-side API endpoint (Route Handler)
// It will be accessible at /api/get-sacrifice-by-id
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
      .select("*")
      .eq("sacrifice_id", id)
      .single();

    if (error) {
      console.error('Error fetching sacrifice animal:', error);
      return NextResponse.json(
        { error: "Failed to fetch sacrifice animal" },
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