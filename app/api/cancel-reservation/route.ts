import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Rezervasyon işlemini iptal eden API endpoint
 * Sadece reservation_transactions tablosundaki status alanını 'canceled' olarak günceller
 * Bu işlem, doğrudan boş hisse (empty_share) sayısını güncellemez - veritabanı trigger'ları bunu yapacaktır
 * 
 * Bu endpoint, normal AJAX istekleri ve navigator.sendBeacon() ile gönderilen istekleri destekler
 */
export async function POST(request: NextRequest) {
  try {
    // Gelen isteğin Content-Type'ını kontrol et
    const contentType = request.headers.get('content-type') || '';
    let transaction_id: string | undefined;

    // İstek tipine göre farklı işle - sendBeacon genellikle application/json ya da text/plain gönderir
    if (contentType.includes('application/json')) {
      // Normal JSON isteği veya sendBeacon JSON
      const requestData = await request.json();
      transaction_id = requestData.transaction_id;
    } else if (contentType.includes('text/plain')) {
      // sendBeacon text/plain olarak gönderebilir
      const text = await request.text();
      try {
        const parsedData = JSON.parse(text);
        transaction_id = parsedData.transaction_id;
      } catch {
      }
    } else {
      // Diğer istek tipleri için
      const formData = await request.formData().catch(() => null);
      if (formData) {
        transaction_id = formData.get('transaction_id')?.toString();
      }
    }

    // transaction_id kontrol et
    if (!transaction_id) {
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
      return NextResponse.json(
        { error: "Rezervasyon bulunamadı" },
        { status: 404 }
      );
    }

    // Eğer rezervasyon zaten iptal edilmişse, bir hata dönme
    if (existingReservation.status === 'canceled') {
      return NextResponse.json({
        success: true,
        message: "Rezervasyon zaten iptal edilmiş",
        data: existingReservation
      });
    }

    // Rezervasyon işlemini 'canceled' olarak güncelle
    const { data, error } = await supabaseAdmin
      .from("reservation_transactions")
      .update({ status: 'canceled' })
      .eq("transaction_id", transaction_id)
      .select();

    if (error) {
      return NextResponse.json(
        { error: "Rezervasyon iptal edilirken hata oluştu" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Rezervasyon başarıyla iptal edildi",
      data
    });
  } catch {
    return NextResponse.json(
      { error: "Beklenmeyen bir hata oluştu" },
      { status: 500 }
    );
  }
} 