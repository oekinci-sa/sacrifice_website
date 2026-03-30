import { formatPhoneE164ForShareholderLookup } from "@/lib/shareholder-lookup-phone";
import { getTenantId } from '@/lib/tenant';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { resolveSacrificeYearForTenant } from '@/lib/sacrifice-year-resolver';
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId();
    const url = new URL(request.url);
    const phone = url.searchParams.get("phone");
    const securityCode = url.searchParams.get("security_code");
    const yearParam = url.searchParams.get("year");

    // Validate required parameters
    if (!phone) {
      return NextResponse.json(
        { error: "Telefon numarası gereklidir" },
        {
          status: 400,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    if (!securityCode) {
      return NextResponse.json(
        { error: "Güvenlik kodu gereklidir" },
        {
          status: 400,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    const formattedPhone = formatPhoneE164ForShareholderLookup(phone);

    // Aktif yılı al - sadece bu yıla ait hisseler döner
    const activeYear = await resolveSacrificeYearForTenant(tenantId, yearParam);

    // Query shareholders with the provided phone number and security code
    // Include related sacrifice data for complete information
    const { data: shareholdersRaw, error } = await supabaseAdmin
      .from("shareholders")
      .select(`
        *,
        sacrifice:sacrifice_animals (
          sacrifice_no,
          sacrifice_time,
          planned_delivery_time,
          share_price,
          share_weight,
          sacrifice_year,
          pricing_mode,
          live_scale_total_kg,
          live_scale_total_price
        )
      `)
      .eq("tenant_id", tenantId)
      .eq("phone_number", formattedPhone)
      .order("purchase_time", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Hissedar bilgileri alınamadı" },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    // Önce güvenlik kodunu en son kayıt ile kontrol et (tüm yıllar)
    const allShareholders = shareholdersRaw ?? [];
    if (allShareholders.length === 0) {
      return NextResponse.json(
        { error: "Bu telefon numarasına ait kayıt bulunamadı" },
        {
          status: 404,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    const latestShareholderForCode = allShareholders[0];
    if (latestShareholderForCode.security_code !== securityCode) {
      return NextResponse.json(
        { error: "Geçersiz güvenlik kodu" },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    // Sadece aktif yıla ait hisseleri filtrele
    const shareholders = allShareholders.filter(
      (sh) => (sh.sacrifice as { sacrifice_year?: number } | null)?.sacrifice_year === activeYear
    );

    if (shareholders.length === 0) {
      return NextResponse.json(
        { error: "Bu telefon numarasına ait bu yıla ait kayıt bulunamadı" },
        {
          status: 404,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    // Security code is valid, return filtered shareholder records (active year only)
    return NextResponse.json({ shareholders }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch {
    return NextResponse.json(
      { error: "Sunucu hatası" },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
} 