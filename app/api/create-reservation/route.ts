import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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
  return new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
    .replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, function(_, day, month, year, hour, minute, second) {
      // Formatlı tarih string'i: YYYY-MM-DD HH:MM:SS.ssssss
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}.000000`;
    });
}

// Rezervasyon oluşturma API endpoint'i
// Bu endpoint, empty_share değerini güncellemez - bu işlem DB tarafında tetiklenir
export async function POST(request: NextRequest) {
  console.log('Received request to create reservation');
  
  try {
    // İstek verilerini al
    const { transaction_id, sacrifice_id, share_count, status = ReservationStatus.ACTIVE } = await request.json();
    
    console.log('Request payload:', { 
      transaction_id, 
      transaction_id_length: transaction_id?.length, 
      sacrifice_id, 
      share_count,
      status
    });

    // Gerekli alanları kontrol et
    if (!transaction_id) {
      console.log('Error: transaction_id is missing');
      return NextResponse.json(
        { error: "transaction_id is required" },
        { status: 400 }
      );
    }

    // transaction_id uzunluğunu kontrol et
    if (transaction_id.length !== TRANSACTION_ID_LENGTH) {
      console.log(`Error: transaction_id length must be exactly ${TRANSACTION_ID_LENGTH} characters, got ${transaction_id.length}`);
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
      console.log('Error: sacrifice_id is missing');
      return NextResponse.json(
        { error: "sacrifice_id is required" },
        { status: 400 }
      );
    }

    if (typeof share_count !== 'number' || share_count <= 0) {
      console.log('Error: invalid share_count:', share_count);
      return NextResponse.json(
        { error: "share_count must be a positive number" },
        { status: 400 }
      );
    }

    // Status değerini kontrol et (güvenlik kontrolü)
    if (status && !Object.values(ReservationStatus).includes(status as ReservationStatus)) {
      console.log(`Error: invalid status value: ${status}`);
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
    console.log('Checking current empty_share for sacrifice_id:', sacrifice_id);
    const { data: currentSacrifice, error: checkError } = await supabaseAdmin
      .from("sacrifice_animals")
      .select("empty_share")
      .eq("sacrifice_id", sacrifice_id)
      .single();
      
    if (checkError) {
      console.error('Error checking sacrifice:', checkError);
      return NextResponse.json(
        { error: "Sacrifice not found or database error", details: checkError.message },
        { status: 500 }
      );
    }
    
    if (!currentSacrifice || currentSacrifice.empty_share < share_count) {
      console.log('Error: Insufficient empty shares', { 
        available: currentSacrifice?.empty_share || 0,
        requested: share_count 
      });
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
    console.log('Using Turkey date/time format:', turkeyDateTime);

    // reservation_transactions tablosuna yeni kayıt ekle
    console.log('Creating reservation transaction record with ID:', transaction_id);
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
      console.error('Error creating reservation:', error);
      
      // Check constraint hatası için daha spesifik mesaj
      let errorMessage = "Failed to create reservation";
      let errorHint = null;
      
      if (error.code === '23514') { // Check constraint violation
        errorMessage = "Database constraint violation: Invalid status value";
        errorHint = "Check allowed values for status field in the reservation_transactions table";
        console.error('Check constraint violation details:', error.details);
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

    console.log('Reservation created successfully:', data);
    
    // Başarılı sonuç döndür
    return NextResponse.json({ 
      success: true,
      message: "Reservation created successfully",
      data
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { 
        error: "An unexpected error occurred", 
        details: errorMessage
      },
      { status: 500 }
    );
  }
} 