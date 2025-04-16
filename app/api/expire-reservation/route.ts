import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { transaction_id } = body;

        if (!transaction_id) {
            return NextResponse.json(
                { error: "transaction_id is required" },
                { status: 400 }
            );
        }

        // Update the reservation status to "EXPIRED" in the database
        const { data, error } = await supabaseAdmin
            .from("reservations")
            .update({ status: "EXPIRED" })
            .eq("transaction_id", transaction_id)
            .select();

        if (error) {
            console.error("Error expiring reservation:", error);
            return NextResponse.json(
                { error: "Failed to expire reservation" },
                { status: 500 }
            );
        }

        // If no rows were updated, the reservation doesn't exist
        if (!data || data.length === 0) {
            return NextResponse.json(
                { error: "Reservation not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 