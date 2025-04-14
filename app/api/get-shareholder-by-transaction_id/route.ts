import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  // URL'den transaction_id'yi al
  const { searchParams } = new URL(request.url);
  const transaction_id = searchParams.get('transaction_id');
  
  console.log('Fetching shareholders for transaction_id:', transaction_id);

  if (!transaction_id) {
    return NextResponse.json(
      { error: "transaction_id parameter is required" },
      { status: 400 }
    );
  }

  try {
    // 1. İlk olarak rezervasyon bilgilerini al
    const { data: reservationData, error: reservationError } = await supabaseAdmin
      .from("reservation_transactions")
      .select("*")
      .eq("transaction_id", transaction_id)
      .single();

    if (reservationError) {
      console.error('Error fetching reservation data:', reservationError);
      return NextResponse.json(
        { error: "Failed to fetch reservation data", details: reservationError.message },
        { status: 500 }
      );
    }

    if (!reservationData) {
      return NextResponse.json(
        { error: "No reservation found with the provided transaction_id" },
        { status: 404 }
      );
    }

    // 2. Kurban bilgilerini al (sacrifice_animals tablosu)
    const { data: sacrificeData, error: sacrificeError } = await supabaseAdmin
      .from("sacrifice_animals")
      .select("*")
      .eq("sacrifice_id", reservationData.sacrifice_id)
      .single();

    if (sacrificeError) {
      console.error('Error fetching sacrifice data:', sacrificeError);
      return NextResponse.json(
        { error: "Failed to fetch sacrifice data", details: sacrificeError.message },
        { status: 500 }
      );
    }
    
    // 3. Hissedar bilgilerini al
    const { data: shareholderData, error: shareholderError } = await supabaseAdmin
      .from("shareholders")
      .select("*")
      .eq("transaction_id", transaction_id);

    if (shareholderError) {
      console.error('Error fetching shareholder data:', shareholderError);
      return NextResponse.json(
        { error: "Failed to fetch shareholder data", details: shareholderError.message },
        { status: 500 }
      );
    }

    // Bütün verileri bir araya getir
    const combinedData = {
      reservation: reservationData,
      sacrifice: sacrificeData,
      shareholders: shareholderData,
    };

    return NextResponse.json(combinedData);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Unexpected error fetching shareholder data:', error);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: errorMessage },
      { status: 500 }
    );
  }
} 