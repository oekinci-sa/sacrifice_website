import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';


// This is a server-side API endpoint (Route Handler)
// It will be accessible at /api/get-sacrifice-animals
export async function GET() {
  try {
    // Use the supabaseAdmin client with service role to fetch data
    const { data, error } = await supabaseAdmin
      .from("sacrifice_animals")
      .select("*") 
      .order("sacrifice_no", { ascending: true });

    if (error) {
      console.error('Error fetching sacrifice animals:', error);
      return NextResponse.json(
        { error: "Failed to fetch sacrifice animals" },
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