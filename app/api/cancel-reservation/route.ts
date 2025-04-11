import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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
      } catch (e) {
        console.error('Beacon request parsing error:', e);
      }
    } else {
      // Diğer istek tipleri için
      console.warn('Unsupported content type:', contentType);
      const formData = await request.formData().catch(() => null);
      if (formData) {
        transaction_id = formData.get('transaction_id')?.toString();
      }
    }
    
    // transaction_id kontrol et
    if (!transaction_id) {
      console.error('Cancel reservation API: transaction_id yok');
      return NextResponse.json(
        { error: "transaction_id gereklidir" },
        { status: 400 }
      );
    }

    // İsteğin kaynağını loglama (debug için)
    console.log(`Cancel reservation API: İstek alındı - transaction_id: ${transaction_id}, Content-Type: ${contentType}`);
    
    // İşlem öncesi mevcut rezervasyonu kontrol et
    const { data: existingReservation, error: fetchError } = await supabaseAdmin
      .from("reservation_transactions")
      .select("status, share_count, sacrifice_id")
      .eq("transaction_id", transaction_id)
      .single();

    if (fetchError) {
      console.error('Cancel reservation API: Rezervasyon bulunamadı:', fetchError);
      return NextResponse.json(
        { error: "Rezervasyon bulunamadı" },
        { status: 404 }
      );
    }

    // Eğer rezervasyon zaten iptal edilmişse, bir hata dönme
    if (existingReservation.status === 'canceled') {
      console.warn('Cancel reservation API: Rezervasyon zaten iptal edilmiş:', transaction_id);
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
      console.error('Cancel reservation API: Rezervasyon iptal edilirken hata oluştu:', error);
      return NextResponse.json(
        { error: "Rezervasyon iptal edilirken hata oluştu" },
        { status: 500 }
      );
    }

    // Başarılı işlem logunu yaz
    console.log(`Rezervasyon başarıyla iptal edildi: ${transaction_id}`);

    return NextResponse.json({
      success: true,
      message: "Rezervasyon başarıyla iptal edildi",
      data
    });
  } catch (error) {
    console.error('Cancel reservation API: Beklenmeyen hata:', error);
    return NextResponse.json(
      { error: "Beklenmeyen bir hata oluştu" },
      { status: 500 }
    );
  }
} 