import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

// Mark this route as dynamic
export const dynamic = "force-dynamic";
export const revalidate = 0;

// This is a server-side API endpoint (Route Handler)
// It will be accessible at /api/update-sacrifice-timing
export async function POST(request: NextRequest) {
    try {
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

        // Get current Istanbul time (+03:00) or null based on is_completed
        let istanbulTime = null;
        if (is_completed) {
            const utcTime = new Date();
            // Add 3 hours to UTC to get Istanbul time
            const istanbulTimeMs = utcTime.getTime() + (3 * 60 * 60 * 1000);
            istanbulTime = new Date(istanbulTimeMs).toISOString();
        }

        // Update the sacrifice timing
        const { data, error } = await supabaseAdmin
            .from("sacrifice_animals")
            .update({ [timeField]: istanbulTime })
            .eq("sacrifice_id", sacrifice_id)
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