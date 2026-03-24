import {
  CLIENT_DEVICE_CATEGORIES,
  isClientDeviceCategory,
  type ClientDeviceCategory,
} from "@/lib/client-device-category";
import { TIMEOUT_DURATION } from "@/lib/constants/reservation-timer";
import {
  resolveSacrificeYearForTenant,
  NO_SACRIFICE_YEAR_ERROR,
} from "@/lib/sacrifice-year-resolver";
import { getTenantId } from "@/lib/tenant";
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
    const body = await request.json();
    const {
      transaction_id,
      sacrifice_id,
      share_count,
      status = ReservationStatus.ACTIVE,
      year: yearParam,
      client_device_category: rawDeviceCategory,
    } = body;

    let clientDeviceCategory: ClientDeviceCategory = "unknown";
    if (rawDeviceCategory !== undefined && rawDeviceCategory !== null) {
      if (!isClientDeviceCategory(rawDeviceCategory)) {
        return NextResponse.json(
          {
            error: "Geçersiz cihaz türü",
            allowed: CLIENT_DEVICE_CATEGORIES,
          },
          { status: 400 }
        );
      }
      clientDeviceCategory = rawDeviceCategory;
    }

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

    const sacrificeYear = await resolveSacrificeYearForTenant(
      tenantId,
      yearParam != null ? String(yearParam) : null
    );

    const { data: currentSacrifice, error: checkError } = await supabaseAdmin
      .from("sacrifice_animals")
      .select("empty_share, sacrifice_year")
      .eq("tenant_id", tenantId)
      .eq("sacrifice_id", sacrifice_id)
      .eq("sacrifice_year", sacrificeYear)
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

    // expires_at: TIMEOUT_DURATION ile client ile senkron (lib/constants/reservation-timer.ts)
    const expiresAt = new Date(Date.now() + TIMEOUT_DURATION * 1000).toISOString();

    // created_at: DB default (now() = UTC) kullanılır
    const { data, error } = await supabaseAdmin
      .from("reservation_transactions")
      .insert([
        {
          tenant_id: tenantId,
          transaction_id,
          sacrifice_id,
          share_count,
          sacrifice_year: currentSacrifice.sacrifice_year,
          status: ReservationStatus.ACTIVE,
          expires_at: expiresAt,
          client_device_category: clientDeviceCategory,
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
  } catch (err) {
    const message =
      err instanceof Error && err.message === NO_SACRIFICE_YEAR_ERROR
        ? err.message
        : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 