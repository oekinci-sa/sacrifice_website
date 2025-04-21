import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

// Veritabanındaki transaction_id sütun uzunluğu
const TRANSACTION_ID_LENGTH = 16;

// Reservation_transactions tablosundaki izin verilen status değerleri
// Veritabanı şeması değişirse, burası güncellenmelidir
enum ReservationStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Türkiye saati için yardımcı fonksiyon
function getTurkeyDateTime() {
  // ISO formatında doğrudan Türkiye saati oluştur (daha güvenilir yöntem)
  const now = new Date();
  // Türkiye'nin zaman dilimi offsetini hesapla (GMT+3 = +180 dakika)
  const offsetMinutes = 180;

  // UTC zamanını alıp Türkiye offsetini ekle
  const turkeyDate = new Date(now.getTime() + offsetMinutes * 60 * 1000);

  // ISO formatını al ve formatla (saat 0-23 arasında garanti edilir)
  const year = turkeyDate.getUTCFullYear();
  const month = String(turkeyDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(turkeyDate.getUTCDate()).padStart(2, '0');
  const hours = String(turkeyDate.getUTCHours()).padStart(2, '0');
  const minutes = String(turkeyDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(turkeyDate.getUTCSeconds()).padStart(2, '0');

  // YYYY-MM-DD HH:MM:SS formatında döndür
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Rezervasyon oluşturma API endpoint'i
// Bu endpoint, empty_share değerini güncellemez - bu işlem DB tarafında tetiklenir
export async function POST(request: NextRequest) {

  try {
    // İstek verilerini al
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

    // Önce boş hisse durumunu kontrol et
    const { data: currentSacrifice, error: checkError } = await supabaseAdmin
      .from("sacrifice_animals")
      .select("empty_share")
      .eq("sacrifice_id", sacrifice_id)
      .single();

    if (checkError) {
      return NextResponse.json(
        { error: "Sacrifice not found or database error", details: checkError.message },
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

    // Türkiye saati ile tarih oluştur
    const turkeyDateTime = getTurkeyDateTime();

    // reservation_transactions tablosuna yeni kayıt ekle
    const { data, error } = await supabaseAdmin
      .from("reservation_transactions")
      .insert([
        {
          transaction_id,
          sacrifice_id,
          share_count,
          status: ReservationStatus.ACTIVE, // Enum değerini kullanıyoruz - veritabanında kabul edilen değer
          created_at: turkeyDateTime
        }
      ])
      .select();

    if (error) {

      // Check constraint hatası için daha spesifik mesaj
      let errorMessage = "Failed to create reservation";
      let errorHint = null;

      if (error.code === '23514') { // Check constraint violation
        errorMessage = "Database constraint violation: Invalid status value";
        errorHint = "Check allowed values for status field in the reservation_transactions table";
      } else if (error.code === '22001') { // Value too long
        errorMessage = "Value too long for database field";
        errorHint = "transaction_id length exceeds database column size (must be 16 characters)";
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: error.message,
          code: error.code,
          hint: errorHint,
          raw_details: error.details
        },
        { status: 500 }
      );
    }


    // Başarılı sonuç döndür
    return NextResponse.json({
      success: true,
      message: "Reservation created successfully",
      data
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: errorMessage
      },
      { status: 500 }
    );
  }
} 