import { resolveSacrificeYearForTenant, NO_SACRIFICE_YEAR_ERROR } from "@/lib/sacrifice-year-resolver";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
    try {
        const tenantId = getTenantId();
        const url = new URL(request.url);
        const phone = url.searchParams.get("phone");
        const yearParam = url.searchParams.get("year");
        const sacrificeYear = await resolveSacrificeYearForTenant(tenantId, yearParam);

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

        // Format phone number (ensure it has +90 format)
        let formattedPhone = phone.replace(/\D/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '+90' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('90')) {
            formattedPhone = '+90' + formattedPhone;
        } else if (!formattedPhone.startsWith('+')) {
            formattedPhone = '+' + formattedPhone;
        }

        // Query shareholders with the provided phone number
        // Include related sacrifice data for complete information
        const { data: shareholders, error } = await supabaseAdmin
            .from("shareholders")
            .select(`
        *,
        sacrifice:sacrifice_animals (
          sacrifice_no,
          sacrifice_time,
          planned_delivery_time,
          share_price,
          share_weight
        )
      `)
            .eq("tenant_id", tenantId)
            .eq("sacrifice_year", sacrificeYear)
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

        // Return all shareholder records
        return NextResponse.json({ shareholders }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (err) {
        const message = err instanceof Error && err.message === NO_SACRIFICE_YEAR_ERROR
            ? err.message
            : "Internal server error";
        return NextResponse.json(
            { error: message },
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