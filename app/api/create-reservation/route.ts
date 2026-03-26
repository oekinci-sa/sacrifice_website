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

// Rezervasyon oluşturma API endpoint'i
// empty_share azaltması rpc_create_reservation içindeki trigger tarafından yapılır
export async function POST(request: NextRequest) {

  try {
    const tenantId = getTenantId();
    const body = await request.json();
    const {
      transaction_id,
      sacrifice_id,
      share_count,
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

    const sacrificeYear = await resolveSacrificeYearForTenant(
      tenantId,
      yearParam != null ? String(yearParam) : null
    );

    // expires_at: TIMEOUT_DURATION ile client ile senkron (lib/constants/reservation-timer.ts)
    const expiresAt = new Date(Date.now() + TIMEOUT_DURATION * 1000).toISOString();

    // rpc_create_reservation: sacrifice_animals satırını FOR UPDATE ile kilitler,
    // boş hisse kontrolü ve INSERT aynı DB transaction içinde — TOCTOU önlenir.
    const { data, error } = await supabaseAdmin.rpc("rpc_create_reservation", {
      p_tenant_id: tenantId,
      p_transaction_id: transaction_id,
      p_sacrifice_id: sacrifice_id,
      p_share_count: share_count,
      p_sacrifice_year: sacrificeYear,
      p_expires_at: expiresAt,
      p_client_device_category: clientDeviceCategory,
    });

    if (error) {
      const msg = error.message ?? "";

      if (msg.includes("sacrifice_not_found")) {
        return NextResponse.json(
          { error: "Sacrifice not found or database error" },
          { status: 500 }
        );
      }

      if (msg.includes("insufficient_shares")) {
        return NextResponse.json(
          {
            error: "Insufficient empty shares",
            available: 0,
            requested: share_count
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Failed to create reservation" },
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