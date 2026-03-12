import { getTenantId } from '@/lib/tenant';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

// Veritabanındaki transaction_id sütun uzunluğu
const TRANSACTION_ID_LENGTH = 16;

// Reservation_transactions tablosundaki izin verilen status değerleri
// Veritabanı şeması değişirse, burası güncellenmelidir
enum ReservationStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELED = 'canceled'
}

// Rezervasyon oluşturma API endpoint'i
// Bu endpoint, empty_share değerini güncellemez - bu işlem DB tarafında tetiklenir
export async function POST(request: NextRequest) {

  try {
    const tenantId = getTenantId();
    const { transaction_id, sacrifice_id, share_count, status = ReservationStatus.ACTIVE } = await request.json();


    // Gerekli alanları kontrol et
    if (!transaction_id) {
      return NextResponse.json(
        { error: "transaction_id is required" },
        { status: 400 }
      );
    }

    // transaction_id uzunluğunu kontrol et
    if (transaction_id.length !== TRANSACTION_ID_LENGTH) {
      return NextResponse.json(
        {
          error: `transaction_id must be exactly ${TRANSACTION_ID_LENGTH} characters long`,
          current_length: transaction_id.length,
          required_length: TRANSACTION_ID_LENGTH
        },
        { status: 400 }
      );
    }

    if (!sacrifice_id) {
      return NextResponse.json(
        { error: "sacrifice_id is required" },
        { status: 400 }
      );
    }

    if (typeof share_count !== 'number' || share_count <= 0) {
      return NextResponse.json(
        { error: "share_count must be a positive number" },
        { status: 400 }
      );
    }

    // Status değerini kontrol et (güvenlik kontrolü)
    if (status && !Object.values(ReservationStatus).includes(status as ReservationStatus)) {
      return NextResponse.json(
        {
          error: "Invalid status value",
          provided: status,
          allowed: Object.values(ReservationStatus)
        },
        { status: 400 }
      );
    }

    const { data: currentSacrifice, error: checkError } = await supabaseAdmin
      .from("sacrifice_animals")
      .select("empty_share")
      .eq("tenant_id", tenantId)
      .eq("sacrifice_id", sacrifice_id)
      .single();

    if (checkError) {
      return NextResponse.json(
        { error: "Sacrifice not found or database error" },
        { status: 500 }
      );
    }

    if (!currentSacrifice || currentSacrifice.empty_share < share_count) {
      return NextResponse.json(
        {
          error: "Insufficient empty shares",
          available: currentSacrifice?.empty_share || 0,
          requested: share_count
        },
        { status: 400 }
      );
    }

    // created_at: DB default (now() = UTC) kullanılır
    const { data, error } = await supabaseAdmin
      .from("reservation_transactions")
      .insert([
        {
          tenant_id: tenantId,
          transaction_id,
          sacrifice_id,
          share_count,
          status: ReservationStatus.ACTIVE,
        }
      ])
      .select();

    if (error) {

      // Check constraint hatası için daha spesifik mesaj
      let errorMessage = "Failed to create reservation";

      if (error.code === '23514') { // Check constraint violation
        errorMessage = "Database constraint violation: Invalid status value";
      } else if (error.code === '22001') { // Value too long
        errorMessage = "Value too long for database field";
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }


    // Başarılı sonuç döndür
    return NextResponse.json({
      success: true,
      message: "Reservation created successfully",
      data
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 