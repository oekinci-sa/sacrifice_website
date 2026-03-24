import { getTenantId } from '@/lib/tenant';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/reservation/heartbeat
 * Client tarafından 15 sn'de bir çağrılır; rezervasyonun hâlâ aktif olduğunu bildirir.
 * last_heartbeat_at güncellenir; pg_cron job 30 sn'den eski heartbeat'li satırları expire eder.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const transaction_id: string | undefined = body?.transaction_id;

    if (!transaction_id) {
      return NextResponse.json(
        { error: 'transaction_id gereklidir' },
        { status: 400 }
      );
    }

    const tenantId = getTenantId();

    const { data: reservation, error: fetchError } = await supabaseAdmin
      .from('reservation_transactions')
      .select('status')
      .eq('tenant_id', tenantId)
      .eq('transaction_id', transaction_id)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json(
        { error: 'Rezervasyon bulunamadı' },
        { status: 404 }
      );
    }

    if (reservation.status !== 'active') {
      return NextResponse.json({
        success: true,
        message: 'Rezervasyon aktif değil',
        status: reservation.status,
      });
    }

    const { error: updateError } = await supabaseAdmin
      .from('reservation_transactions')
      .update({ last_heartbeat_at: new Date().toISOString() })
      .eq('tenant_id', tenantId)
      .eq('transaction_id', transaction_id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Heartbeat güncellenemedi' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}
