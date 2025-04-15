import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Rezervasyon işlemindeki hisse adedini günceller
 * Yalnızca reservation_transactions tablosundaki share_count değerini değiştirir
 * empty_share değeri veritabanı tarafındaki trigger ile otomatik güncellenir
 */
export async function POST(request: NextRequest) {
  try {
    // İstek gövdesinden gerekli verileri al
    const { transaction_id, share_count, operation } = await request.json();

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

    // Önce mevcut rezervasyonu kontrol et
    const { error: fetchError } = await supabaseAdmin
      .from("reservation_transactions")
      .select("share_count, sacrifice_id")
      .eq("transaction_id", transaction_id)
      .single();

    if (fetchError) {
      console.error('Rezervasyon bulunamadı:', fetchError);
      return NextResponse.json(
        { error: "Rezervasyon bulunamadı" },
        { status: 404 }
      );
    }

    // Rezervasyon işlemini güncelle
    const { data, error } = await supabaseAdmin
      .from("reservation_transactions")
      .update({ share_count: share_count })
      .eq("transaction_id", transaction_id)
      .select();

    if (error) {
      console.error('Rezervasyon güncellenirken hata oluştu:', error);
      return NextResponse.json(
        { error: "Rezervasyon güncellenirken hata oluştu" },
        { status: 500 }
      );
    }

    // İşlem tipini ve detayını loglama
    console.log(`Rezervasyon hisse adedi güncellendi: ${transaction_id}, yeni adet: ${share_count}, işlem: ${operation || 'güncelleme'}`);

    return NextResponse.json({
      success: true,
      message: "Rezervasyon hisse adedi başarıyla güncellendi",
      data
    });
  } catch (error) {
    console.error('Beklenmeyen hata:', error);
    return NextResponse.json(
      { error: "Beklenmeyen bir hata oluştu" },
      { status: 500 }
    );
  }
} 