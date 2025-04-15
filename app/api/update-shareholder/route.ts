import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

// Define the expected structure for shareholder updates
interface ShareholderUpdateInput {
  shareholder_id: string; // Required for identifying which shareholder to update
  shareholder_name?: string;
  phone_number?: string;
  delivery_fee?: number;
  delivery_location?: string;
  sacrifice_consent?: boolean;
  notes?: string;
  remaining_payment?: number;
  paid_amount?: number;
  last_edited_by: string; // Required to track who made the changes
}

// Define a type for the database update fields which includes last_edited_time
interface UpdateFields {
  shareholder_name?: string;
  phone_number?: string;
  delivery_fee?: number;
  delivery_location?: string;
  sacrifice_consent?: boolean;
  notes?: string;
  remaining_payment?: number;
  paid_amount?: number;
  last_edited_by: string;
  last_edited_time?: string;
}

/**
 * API endpoint to update a single shareholder's information
 * This endpoint handles partial updates to shareholder records
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const updateData: ShareholderUpdateInput = await request.json();

    // Validate required fields
    if (!updateData.shareholder_id) {
      return NextResponse.json(
        { error: "shareholder_id is required" },
        { status: 400 }
      );
    }

    if (!updateData.last_edited_by) {
      return NextResponse.json(
        { error: "last_edited_by is required" },
        { status: 400 }
      );
    }

    // Create update object - only include fields that were provided
    const updateFields: UpdateFields = {
      last_edited_by: updateData.last_edited_by // Required field
    };

    // Copy other fields if they exist
    if (updateData.shareholder_name !== undefined) updateFields.shareholder_name = updateData.shareholder_name;
    if (updateData.phone_number !== undefined) updateFields.phone_number = updateData.phone_number;
    if (updateData.delivery_fee !== undefined) updateFields.delivery_fee = updateData.delivery_fee;
    if (updateData.delivery_location !== undefined) updateFields.delivery_location = updateData.delivery_location;
    if (updateData.sacrifice_consent !== undefined) updateFields.sacrifice_consent = updateData.sacrifice_consent;
    if (updateData.notes !== undefined) updateFields.notes = updateData.notes;
    if (updateData.remaining_payment !== undefined) updateFields.remaining_payment = updateData.remaining_payment;
    if (updateData.paid_amount !== undefined) updateFields.paid_amount = updateData.paid_amount;

    // Add last_edited_time
    updateFields.last_edited_time = new Date().toISOString();

    console.log(`[API] Updating shareholder: ${updateData.shareholder_id}`);
    console.log(`[API] Update fields: ${JSON.stringify(updateFields)}`);

    // Update the shareholder in the database
    const { data, error } = await supabaseAdmin
      .from("shareholders")
      .update(updateFields)
      .eq("shareholder_id", updateData.shareholder_id)
      .select();

    if (error) {
      console.error('[API] Error updating shareholder:', error);
      return NextResponse.json(
        { error: "Failed to update shareholder", details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Shareholder not found" },
        { status: 404 }
      );
    }

    console.log(`[API] Shareholder updated successfully: ${updateData.shareholder_id}`);

    return NextResponse.json({
      success: true,
      message: "Shareholder updated successfully",
      data: data[0]
    });

  } catch (err) {
    console.error("[API] Unexpected error updating shareholder:", err);
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
} 