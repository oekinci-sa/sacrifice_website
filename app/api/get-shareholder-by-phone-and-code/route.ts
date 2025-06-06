import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from "next/server";

// Mark this route as dynamic since it uses request.url
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Extract phone and security code from the URL parameters
    const url = new URL(request.url);
    const phone = url.searchParams.get("phone");
    const securityCode = url.searchParams.get("security_code");

    // Validate required parameters
    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
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
        { error: "Security code is required" },
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

    // Format phone number (ensure it has +90 format)
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+90' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('90')) {
      formattedPhone = '+90' + formattedPhone;
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    // Query shareholders with the provided phone number and security code
    // Include related sacrifice data for complete information
    const { data: shareholders, error } = await supabaseAdmin
      .from("shareholders")
      .select(`
        *,
        sacrifice:sacrifice_animals (
          sacrifice_no,
          sacrifice_time,
          share_price,
          share_weight
        )
      `)
      .eq("phone_number", formattedPhone)
      .order("purchase_time", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch shareholder information" },
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

    if (!shareholders || shareholders.length === 0) {
      return NextResponse.json(
        { error: "No shareholders found with the provided phone number" },
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

    // Check if the security code matches the most recent shareholder record
    const latestShareholder = shareholders[0];
    if (latestShareholder.security_code !== securityCode) {
      return NextResponse.json(
        { error: "Invalid security code" },
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

    // Security code is valid, return all shareholder records
    return NextResponse.json({ shareholders }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
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