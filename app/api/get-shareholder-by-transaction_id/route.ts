import { getTenantId } from '@/lib/tenant';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const tenantId = getTenantId();
  const { searchParams } = new URL(request.url);
  const transaction_id = searchParams.get('transaction_id');

  if (!transaction_id) {
    return NextResponse.json(
      { error: "transaction_id parameter is required" },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }

  try {
    // 1. İlk olarak rezervasyon bilgilerini al
    const { data: reservationData, error: reservationError } = await supabaseAdmin
      .from("reservation_transactions")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("transaction_id", transaction_id)
      .single();

    if (reservationError) {
      return NextResponse.json(
        { error: "Failed to fetch reservation data", details: reservationError.message },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    if (!reservationData) {
      return NextResponse.json(
        { error: "No reservation found with the provided transaction_id" },
        {
          status: 404,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    // 2. Kurban bilgilerini al (sacrifice_animals tablosu)
    const { data: sacrificeData, error: sacrificeError } = await supabaseAdmin
      .from("sacrifice_animals")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("sacrifice_id", reservationData.sacrifice_id)
      .single();

    if (sacrificeError) {
      return NextResponse.json(
        { error: "Failed to fetch sacrifice data", details: sacrificeError.message },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    // 3. Hissedar bilgilerini al
    const { data: shareholderData, error: shareholderError } = await supabaseAdmin
      .from("shareholders")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("transaction_id", transaction_id);

    if (shareholderError) {
      return NextResponse.json(
        { error: "Failed to fetch shareholder data", details: shareholderError.message },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    // Bütün verileri bir araya getir
    const combinedData = {
      reservation: reservationData,
      sacrifice: sacrificeData,
      shareholders: shareholderData,
    };

    return NextResponse.json(combinedData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
} 