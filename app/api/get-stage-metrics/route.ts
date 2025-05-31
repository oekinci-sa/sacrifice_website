import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

// Mark this route as dynamic since it uses request.nextUrl.searchParams
export const dynamic = "force-dynamic";
export const revalidate = 0;

// This is a server-side API endpoint (Route Handler)
// It will be accessible at /api/get-stage-metrics
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const stage = searchParams.get('stage');

        let query = supabaseAdmin.from("stage_metrics").select("*");

        if (stage) {
            query = query.eq("stage", stage);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json(
                { error: "Failed to fetch stage metrics" },
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

        // Return the data
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