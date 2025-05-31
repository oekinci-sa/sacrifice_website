import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

// Mark this route as dynamic
export const dynamic = "force-dynamic";
export const revalidate = 0;

// This is a server-side API endpoint (Route Handler)
// It will be accessible at /api/check-sacrifice-timing
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sacrifice_id = searchParams.get('sacrifice_id');

        if (!sacrifice_id) {
            return NextResponse.json(
                { error: "sacrifice_id is required" },
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

        // Get all timing fields for the sacrifice
        const { data, error } = await supabaseAdmin
            .from("sacrifice_animals")
            .select("slaughter_time, butcher_time, delivery_time")
            .eq("sacrifice_id", sacrifice_id)
            .single();

        if (error) {
            return NextResponse.json(
                { error: "Failed to check sacrifice timing" },
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

        // Return all stage completion status
        const result = {
            slaughter_completed: data && data.slaughter_time !== null,
            butcher_completed: data && data.butcher_time !== null,
            delivery_completed: data && data.delivery_time !== null,
            slaughter_time: data ? data.slaughter_time : null,
            butcher_time: data ? data.butcher_time : null,
            delivery_time: data ? data.delivery_time : null
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
