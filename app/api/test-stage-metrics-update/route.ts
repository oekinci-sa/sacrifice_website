import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

// Mark this route as dynamic
export const dynamic = "force-dynamic";
export const revalidate = 0;

// This is a test endpoint to update stage metrics for real-time testing
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { stage, increment = 1 } = body;

        console.log(`[test-stage-metrics-update] Received request for stage: ${stage}, increment: ${increment}`);

        if (!stage) {
            console.log(`[test-stage-metrics-update] Error: Stage is required`);
            return NextResponse.json(
                { error: "Stage is required" },
                { status: 400 }
            );
        }

        // First, get the current value
        console.log(`[test-stage-metrics-update] Fetching current stage metrics for: ${stage}`);
        const { data: currentData, error: getCurrentError } = await supabaseAdmin
            .from("stage_metrics")
            .select("current_sacrifice_number")
            .eq("stage", stage)
            .single();

        if (getCurrentError) {
            console.error(`[test-stage-metrics-update] Error fetching current data:`, getCurrentError);
            return NextResponse.json(
                { error: "Failed to get current stage metrics" },
                { status: 500 }
            );
        }

        console.log(`[test-stage-metrics-update] Current data for ${stage}:`, currentData);

        const oldNumber = currentData?.current_sacrifice_number || 0;
        const newNumber = oldNumber + increment;

        console.log(`[test-stage-metrics-update] Updating ${stage}: ${oldNumber} -> ${newNumber}`);

        // Update the stage metrics
        const { data, error } = await supabaseAdmin
            .from("stage_metrics")
            .update({
                current_sacrifice_number: newNumber,
                updated_at: new Date().toISOString()
            })
            .eq("stage", stage)
            .select();

        if (error) {
            console.error(`[test-stage-metrics-update] Error updating stage metrics:`, error);
            return NextResponse.json(
                { error: "Failed to update stage metrics" },
                { status: 500 }
            );
        }

        console.log(`[test-stage-metrics-update] Stage ${stage} updated successfully to ${newNumber}`);
        console.log(`[test-stage-metrics-update] Updated data:`, data);

        return NextResponse.json({
            success: true,
            stage,
            old_number: oldNumber,
            new_number: newNumber,
            data
        });
    } catch (error) {
        console.error('[test-stage-metrics-update] Unexpected error:', error);
        return NextResponse.json(
            { error: "An unexpected error occurred" },
            { status: 500 }
        );
    }
} 