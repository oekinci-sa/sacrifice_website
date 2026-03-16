import { authOptions } from '@/lib/auth';
import { getDeliveryFeeForLocation, getDeliveryFeeForType } from '@/lib/delivery-options';
import { getTenantId } from '@/lib/tenant';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { formatPhoneForDB } from '@/utils/formatters';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// Define the expected structure for shareholder updates
interface ShareholderUpdateInput {
  shareholder_id: string; // Required for identifying which shareholder to update
  shareholder_name?: string;
  phone_number?: string;
  delivery_fee?: number;
  delivery_location?: string;
  delivery_type?: string; // Kesimhane | Adrese teslim | Ulus
  sacrifice_consent?: boolean;
  notes?: string;
  remaining_payment?: number;
  paid_amount?: number;
  security_code?: string;
  last_edited_by: string; // Required to track who made the changes
}

// Define a type for the database update fields which includes last_edited_time
interface UpdateFields {
  shareholder_name?: string;
  phone_number?: string;
  delivery_fee?: number;
  delivery_location?: string;
  delivery_type?: string;
  total_amount?: number;
  sacrifice_consent?: boolean;
  notes?: string;
  remaining_payment?: number;
  paid_amount?: number;
  security_code?: string;
  last_edited_by: string;
  last_edited_time?: string;
}

/**
 * API endpoint to update a single shareholder's information
 * This endpoint handles partial updates to shareholder records
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "super_admin" && session.user.role !== "editor")) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const tenantId = getTenantId();
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

    // Copy other fields if they exist (phone_number: her zaman +90 formatında sakla)
    if (updateData.shareholder_name !== undefined) updateFields.shareholder_name = updateData.shareholder_name;
    if (updateData.phone_number !== undefined) {
      const formatted = formatPhoneForDB(updateData.phone_number);
      if (formatted) updateFields.phone_number = formatted;
    }
    if (updateData.delivery_fee !== undefined) updateFields.delivery_fee = updateData.delivery_fee;
    if (updateData.delivery_location !== undefined) updateFields.delivery_location = updateData.delivery_location;
    if (updateData.delivery_type !== undefined) updateFields.delivery_type = updateData.delivery_type;

    // delivery_location veya delivery_type değiştiğinde delivery_fee, total_amount, remaining_payment otomatik güncelle
    if (updateData.delivery_location !== undefined || updateData.delivery_type !== undefined) {
      const { data: existing } = await supabaseAdmin
        .from("shareholders")
        .select("sacrifice_id, paid_amount, delivery_location, delivery_type")
        .eq("tenant_id", tenantId)
        .eq("shareholder_id", updateData.shareholder_id)
        .single();

      if (existing) {
        const { data: ts } = await supabaseAdmin
          .from("tenant_settings")
          .select("logo_slug")
          .eq("tenant_id", tenantId)
          .single();
        const logoSlug = ts?.logo_slug ?? "ankara-kurban";

        const loc = updateData.delivery_location ?? existing.delivery_location ?? "";
        const type = updateData.delivery_type ?? existing.delivery_type ?? "";
        const deliveryFee =
          type ? getDeliveryFeeForType(logoSlug, type)
          : getDeliveryFeeForLocation(logoSlug, loc);

        const { data: sacrifice } = await supabaseAdmin
          .from("sacrifice_animals")
          .select("share_price")
          .eq("sacrifice_id", existing.sacrifice_id)
          .single();

        const sharePrice = Number(sacrifice?.share_price ?? 0);
        const totalAmount = sharePrice + deliveryFee;
        const paidAmount = Number(existing.paid_amount ?? 0);
        const remainingPayment = totalAmount - paidAmount;

        updateFields.delivery_fee = deliveryFee;
        updateFields.total_amount = totalAmount;
        updateFields.remaining_payment = remainingPayment;
      }
    }

    if (updateData.sacrifice_consent !== undefined) updateFields.sacrifice_consent = updateData.sacrifice_consent;
    if (updateData.notes !== undefined) updateFields.notes = updateData.notes;
    if (updateData.remaining_payment !== undefined) updateFields.remaining_payment = updateData.remaining_payment;
    if (updateData.paid_amount !== undefined) updateFields.paid_amount = updateData.paid_amount;
    if (updateData.security_code !== undefined) updateFields.security_code = updateData.security_code;

    // Add last_edited_time
    updateFields.last_edited_time = new Date().toISOString();

    // Update the shareholder in the database
    const { data, error } = await supabaseAdmin
      .from("shareholders")
      .update(updateFields)
      .eq("tenant_id", tenantId)
      .eq("shareholder_id", updateData.shareholder_id)
      .select();

    if (error) {
      return NextResponse.json(
        { error: "Hissedar güncellenemedi" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Hissedar bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Shareholder updated successfully",
      data: data[0]
    });

  } catch {
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
} 