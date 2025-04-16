import { ReservationStatus } from '@/hooks/useReservations';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        // Extract transaction_id from the request body
        const { transaction_id } = await request.json();
        console.log('Received expire request for transaction_id:', transaction_id);

        if (!transaction_id) {
            console.error('No transaction_id provided in request');
            return NextResponse.json(
                { error: 'transaction_id is required' },
                { status: 400 }
            );
        }

        // Verify ReservationStatus enum has the EXPIRED value
        if (ReservationStatus.EXPIRED === undefined) {
            console.error('ReservationStatus.EXPIRED is undefined. Available values:', Object.values(ReservationStatus));
            return NextResponse.json(
                { error: 'Invalid ReservationStatus.EXPIRED value' },
                { status: 500 }
            );
        }

        // Test the database connection first
        try {
            const { error: pingError } = await supabaseAdmin.from('reservation_transactions').select('count').limit(1);
            if (pingError) {
                console.error('Database connection test failed:', pingError);
                return NextResponse.json(
                    { error: `Database connection failed: ${pingError.message}` },
                    { status: 500 }
                );
            }
            console.log('Database connection test successful');
        } catch (dbTestError) {
            console.error('Exception during database connection test:', dbTestError);
            return NextResponse.json(
                { error: `Database connection exception: ${dbTestError instanceof Error ? dbTestError.message : String(dbTestError)}` },
                { status: 500 }
            );
        }

        // Get current reservation to check if it exists and isn't already expired
        console.log('Fetching reservation for transaction_id:', transaction_id);
        const { data: existingReservation, error: fetchError } = await supabaseAdmin
            .from('reservation_transactions')
            .select('*')
            .eq('transaction_id', transaction_id)
            .single();

        if (fetchError) {
            console.error('Error fetching reservation:', fetchError);
            return NextResponse.json(
                { error: `Failed to fetch reservation: ${fetchError.message}` },
                { status: 500 }
            );
        }

        if (!existingReservation) {
            console.error('Reservation not found for transaction_id:', transaction_id);
            return NextResponse.json(
                { error: 'Reservation not found' },
                { status: 404 }
            );
        }

        console.log('Found reservation with status:', existingReservation.status);
        console.log('Full reservation data:', JSON.stringify(existingReservation, null, 2));

        // Don't update if already expired
        if (existingReservation.status === ReservationStatus.EXPIRED) {
            console.log('Reservation already expired, no update needed');
            return NextResponse.json(
                { message: 'Reservation is already expired', reservation: existingReservation },
                { status: 200 }
            );
        }

        // Update reservation status to EXPIRED
        console.log('Updating reservation status to EXPIRED (enum value:', ReservationStatus.EXPIRED, ')');
        const updatePayload = {
            status: ReservationStatus.EXPIRED,
        };
        console.log('Update payload:', updatePayload);

        try {
            const { data: updatedReservation, error: updateError } = await supabaseAdmin
                .from('reservation_transactions')
                .update(updatePayload)
                .eq('transaction_id', transaction_id)
                .select()
                .single();

            if (updateError) {
                console.error('Error updating reservation status:', updateError);
                return NextResponse.json(
                    { error: `Failed to update reservation status: ${updateError.message}` },
                    { status: 500 }
                );
            }

            if (!updatedReservation) {
                console.error('No reservation returned after update');
                return NextResponse.json(
                    { error: 'Update succeeded but no reservation was returned' },
                    { status: 500 }
                );
            }

            console.log('Successfully updated reservation status to EXPIRED');
            console.log('Updated reservation data:', JSON.stringify(updatedReservation, null, 2));

            // Return the expired reservation
            return NextResponse.json({
                message: 'Reservation expired successfully',
                reservation: updatedReservation
            });
        } catch (updateException) {
            console.error('Exception during reservation update:', updateException);
            return NextResponse.json(
                { error: `Update exception: ${updateException instanceof Error ? updateException.message : String(updateException)}` },
                { status: 500 }
            );
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Server error in expire-reservation endpoint:', errorMessage);
        // If error is an object with more details, log them
        if (error && typeof error === 'object') {
            console.error('Error details:', JSON.stringify(error, null, 2));
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