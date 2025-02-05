import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { sacrificeId, increaseAmount } = data;

    // Get current empty_share value
    const { data: currentSacrifice, error: fetchError } = await supabase
      .from("sacrifice_animals")
      .select("empty_share")
      .eq("sacrifice_id", sacrificeId)
      .single();

    if (fetchError || !currentSacrifice) {
      return NextResponse.json({ error: "Failed to fetch current empty_share" }, { status: 500 });
    }

    // Update empty_share
    const { error: updateError } = await supabase
      .from("sacrifice_animals")
      .update({ empty_share: currentSacrifice.empty_share + increaseAmount })
      .eq("sacrifice_id", sacrificeId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update empty_share" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating empty share:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 