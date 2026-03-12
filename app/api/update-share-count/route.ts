import { getTenantId } from '@/lib/tenant';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Rezervasyon işlemindeki hisse adedini günceller
 * Yalnızca reservation_transactions tablosundaki share_count değerini değiştirir
 * empty_share değeri veritabanı tarafındaki trigger ile otomatik güncellenir
 */
export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantId();
    const { transaction_id, share_count } = await request.json();

    // Gelen veriyi kontrol et
    if (!transaction_id) {
      return NextResponse.json(
        { error: "transaction_id gereklidir" },
        { status: 400 }
      );
    }

    if (typeof share_count !== 'number' || share_count < 1) {
      return NextResponse.json(
        { error: "share_count pozitif bir sayı olmalıdır" },
        { status: 400 }
      );
    }

    const { error: fetchError } = await supabaseAdmin
      .from("reservation_transactions")
      .select("share_count, sacrifice_id")
      .eq("tenant_id", tenantId)
      .eq("transaction_id", transaction_id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: "Rezervasyon bulunamadı" },
        { status: 404 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("reservation_transactions")
      .update({ share_count: share_count })
      .eq("tenant_id", tenantId)
      .eq("transaction_id", transaction_id)
      .select();

    if (error) {
      return NextResponse.json(
        { error: "Rezervasyon güncellenirken hata oluştu" },
        { status: 500 }
      );
    }

    // İşlem tipini ve detayını loglama
    return NextResponse.json({
      success: true,
      message: "Rezervasyon hisse adedi başarıyla güncellendi",
      data
    });
  } catch {
    return NextResponse.json(
      { error: "Beklenmeyen bir hata oluştu" },
      { status: 500 }
    );
  }
} 