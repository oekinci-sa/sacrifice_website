import { getDefaultSacrificeYear } from '@/lib/constants/sacrifice-year';
import { getTenantId } from '@/lib/tenant';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
    try {
        const tenantId = getTenantId();
        const sacrificeYear = getDefaultSacrificeYear();
        const body = await request.json();
        const { sacrifice_id, stage, is_completed } = body;

        if (!sacrifice_id || !stage) {
            return NextResponse.json(
                { error: "sacrifice_id and stage are required" },
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

        // Determine which field to update based on stage
        let timeField: string;
        switch (stage) {
            case 'slaughter_stage':
                timeField = 'slaughter_time';
                break;
            case 'butcher_stage':
                timeField = 'butcher_time';
                break;
            case 'delivery_stage':
                timeField = 'delivery_time';
                break;
            default:
                return NextResponse.json(
                    { error: "Invalid stage" },
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

        // DB TIMESTAMPTZ: UTC ile sakla
        const completedTime = is_completed ? new Date().toISOString() : null;

        const { data, error } = await supabaseAdmin
            .from("sacrifice_animals")
            .update({ [timeField]: completedTime })
            .eq("tenant_id", tenantId)
            .eq("sacrifice_id", sacrifice_id)
            .eq("sacrifice_year", sacrificeYear)
            .select();

        if (error) {
            return NextResponse.json(
                { error: "Failed to update sacrifice timing" },
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

        // Return the updated data
        return NextResponse.json(data, {
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