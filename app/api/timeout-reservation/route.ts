import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Rezervasyon zaman aşımı durumunu yöneten API endpoint
 * reservation_transactions tablosundaki status alanını 'timed out' olarak günceller
 * Bu işlem, empty_share alanını etkilemez - veritabanı trigger'ları ilgili güncellemeleri yapacaktır
 */
export async function POST(request: NextRequest) {
  try {
    // İstek gövdesinden transaction_id'yi al
    const { transaction_id } = await request.json();
    
    // transaction_id kontrol et
    if (!transaction_id) {
      console.error('Timeout reservation API: transaction_id yok');
      return NextResponse.json(
        { error: "transaction_id gereklidir" },
        { status: 400 }
      );
    }
    
    // İşlem öncesi mevcut rezervasyonu kontrol et
    const { data: existingReservation, error: fetchError } = await supabaseAdmin
      .from("reservation_transactions")
      .select("status, share_count, sacrifice_id")
      .eq("transaction_id", transaction_id)
      .single();

    if (fetchError) {
      console.error('Timeout reservation API: Rezervasyon bulunamadı:', fetchError);
      return NextResponse.json(
        { error: "Rezervasyon bulunamadı" },
        { status: 404 }
      );
    }

    // Eğer rezervasyon zaten işlenmişse (timed out, canceled, completed vb.)
    if (existingReservation.status !== 'active') {
      console.warn(`Timeout reservation API: Rezervasyon zaten ${existingReservation.status} durumunda:`, transaction_id);
      return NextResponse.json({
        success: true,
        message: `Rezervasyon zaten ${existingReservation.status} durumunda`,
        data: existingReservation
      });
    }

    // Rezervasyon işlemini 'timed out' olarak güncelle
    const { data, error } = await supabaseAdmin
      .from("reservation_transactions")
      .update({ status: 'timed out' })
      .eq("transaction_id", transaction_id)
      .select();

    if (error) {
      console.error('Timeout reservation API: Rezervasyon zaman aşımı güncellemesi sırasında hata oluştu:', error);
      return NextResponse.json(
        { error: "Rezervasyon zaman aşımı güncellemesi sırasında hata oluştu" },
        { status: 500 }
      );
    }

    // Başarılı işlem logunu yaz
    console.log(`Rezervasyon başarıyla zaman aşımına uğradı: ${transaction_id}`);

    return NextResponse.json({
      success: true,
      message: "Rezervasyon zaman aşımı durumu başarıyla güncellendi",
      data
    });
  } catch (error) {
    console.error('Timeout reservation API: Beklenmeyen hata:', error);
    return NextResponse.json(
      { error: "Beklenmeyen bir hata oluştu" },
      { status: 500 }
    );
  }
} 