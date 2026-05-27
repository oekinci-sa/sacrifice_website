import { getDefaultSacrificeYear } from '@/lib/constants/sacrifice-year';
import { getTenantId } from '@/lib/tenant';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

// Mark this route as dynamic
export const dynamic = "force-dynamic";
export const revalidate = 0;

// This is a server-side API endpoint (Route Handler)
// It will be accessible at /api/check-sacrifice-timing
export async function GET(request: NextRequest) {
    try {
        const tenantId = getTenantId();
        const sacrificeYear = getDefaultSacrificeYear();
        const { searchParams } = new URL(request.url);
        const sacrificeNoRaw = searchParams.get('sacrifice_no');

        if (!sacrificeNoRaw) {
            return NextResponse.json(
                { error: "sacrifice_no is required" },
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

        const sacrificeNo = parseInt(sacrificeNoRaw, 10);
        if (isNaN(sacrificeNo) || sacrificeNo <= 0) {
            return NextResponse.json(
                { error: "sacrifice_no geçersiz" },
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

        const [{ data, error }, { data: tsData }] = await Promise.all([
            supabaseAdmin
                .from("sacrifice_animals")
                .select("slaughter_time, butcher_time, delivery_time, delivered_share_kg, delivery_notes")
                .eq("tenant_id", tenantId)
                .eq("sacrifice_no", sacrificeNo)
                .eq("sacrifice_year", sacrificeYear)
                .maybeSingle(),
            supabaseAdmin
                .from("tenant_settings")
                .select("butcher_stage_required")
                .eq("tenant_id", tenantId)
                .maybeSingle(),
        ]);

        if (error) {
            return NextResponse.json(
                { error: "Kurban durumu kontrol edilemedi" },
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

        const butcherStageRequired = tsData?.butcher_stage_required !== false;

        if (!data) {
            return NextResponse.json(
                {
                    exists: false,
                    slaughter_completed: false,
                    butcher_completed: false,
                    delivery_completed: false,
                    slaughter_time: null,
                    butcher_time: null,
                    delivery_time: null,
                    delivered_share_kg: null,
                    delivery_notes: null,
                    butcher_stage_required: butcherStageRequired,
                },
                {
                    headers: {
                        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                }
            );
        }

        // Return all stage completion status
        const result = {
            exists: true,
            slaughter_completed: data.slaughter_time !== null,
            butcher_completed: data.butcher_time !== null,
            delivery_completed: data.delivery_time !== null,
            slaughter_time: data.slaughter_time,
            butcher_time: data.butcher_time,
            delivery_time: data.delivery_time,
            delivered_share_kg: data.delivered_share_kg,
            delivery_notes: data.delivery_notes,
            butcher_stage_required: butcherStageRequired,
        };

        return NextResponse.json(result, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch {
        return NextResponse.json(
            { error: "An unexpected error occurred" },
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
