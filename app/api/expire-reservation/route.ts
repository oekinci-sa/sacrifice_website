import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { ReservationStatus } from '@/types/reservation';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        // Extract transaction_id from the request body
        const { transaction_id } = await request.json();

        if (!transaction_id) {
            return NextResponse.json(
                { error: 'transaction_id is required' },
                { status: 400 }
            );
        }

        // Verify ReservationStatus enum has the EXPIRED value
        if (ReservationStatus.EXPIRED === undefined) {
            return NextResponse.json(
                { error: 'Invalid ReservationStatus.EXPIRED value' },
                { status: 500 }
            );
        }

        // Test the database connection first
        try {
            const { error: pingError } = await supabaseAdmin.from('reservation_transactions').select('count').limit(1);
            if (pingError) {
                return NextResponse.json(
                    { error: `Database connection failed: ${pingError.message}` },
                    { status: 500 }
                );
            }
        } catch (dbTestError) {
            return NextResponse.json(
                { error: `Database connection exception: ${dbTestError instanceof Error ? dbTestError.message : String(dbTestError)}` },
                { status: 500 }
            );
        }

        // Get current reservation to check if it exists and isn't already expired
        const { data: existingReservation, error: fetchError } = await supabaseAdmin
            .from('reservation_transactions')
            .select('*')
            .eq('transaction_id', transaction_id)
            .single();

        if (fetchError) {
            return NextResponse.json(
                { error: `Failed to fetch reservation: ${fetchError.message}` },
                { status: 500 }
            );
        }

        if (!existingReservation) {
            return NextResponse.json(
                { error: 'Reservation not found' },
                { status: 404 }
            );
        }

        // Don't update if already expired or timed out
        if (existingReservation.status === ReservationStatus.EXPIRED || existingReservation.status === 'timed_out') {
            return NextResponse.json(
                { message: 'Reservation is already expired or timed out', reservation: existingReservation },
                { status: 200 }
            );
        }

        // Update reservation status to "timed_out" (instead of EXPIRED)
        const updatePayload = {
            status: 'timed_out',
        };

        try {
            const { data: updatedReservation, error: updateError } = await supabaseAdmin
                .from('reservation_transactions')
                .update(updatePayload)
                .eq('transaction_id', transaction_id)
                .select()
                .single();

            if (updateError) {
                return NextResponse.json(
                    { error: `Failed to update reservation status: ${updateError.message}` },
                    { status: 500 }
                );
            }

            if (!updatedReservation) {
                return NextResponse.json(
                    { error: 'Update succeeded but no reservation was returned' },
                    { status: 500 }
                );
            }


            // Return the timed out reservation
            return NextResponse.json({
                message: 'Reservation timed out successfully',
                reservation: updatedReservation
            });
        } catch (updateException) {
            return NextResponse.json(
                { error: `Update exception: ${updateException instanceof Error ? updateException.message : String(updateException)}` },
                { status: 500 }
            );
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        // If error is an object with more details, log them
        if (error && typeof error === 'object') {
        }
        return NextResponse.json(
            { error: `Internal server error: ${errorMessage}` },
            { status: 500 }
        );
    }
}

export async function GET() {
    // For health checks - can be used to verify the endpoint is running
    return NextResponse.json({
        message: 'Expire reservation endpoint is operational',
        // Return ReservationStatus to help debug
        reservationStatus: {
            values: Object.entries(ReservationStatus).map(([key, value]) => ({ key, value }))
        }
    });
} 