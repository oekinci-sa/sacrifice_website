import { authOptions } from '@/lib/auth';
import { getSessionActorEmail, sessionHasAdminEditorOrSuperRole } from '@/lib/admin-editor-session';
import { getDeliveryFeeForLocation, getDeliveryFeeForType } from '@/lib/delivery-options';
import { getTenantId } from '@/lib/tenant';
import { buildEmailToEditorDisplayMap, editorDisplayFromRaw } from '@/lib/resolve-editor-display';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { formatPhoneForDB } from '@/utils/formatters';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// Define the expected structure for shareholder updates
interface ShareholderUpdateInput {
  shareholder_id: string; // Required for identifying which shareholder to update
  shareholder_name?: string;
  phone_number?: string;
  email?: string | null;
  second_phone_number?: string | null;
  delivery_fee?: number;
  delivery_location?: string;
  delivery_type?: string; // Kesimhane | Adrese teslim | Ulus
  sacrifice_consent?: boolean;
  notes?: string;
  remaining_payment?: number;
  paid_amount?: number;
  security_code?: string;
  /** İstemci gönderebilir; API dikkate almaz, oturumdan türetilir (Faz 1). */
  last_edited_by?: string;
}

// Define a type for the database update fields which includes last_edited_time
interface UpdateFields {
  shareholder_name?: string;
  phone_number?: string;
  email?: string | null;
  second_phone_number?: string | null;
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
    if (!sessionHasAdminEditorOrSuperRole(session)) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const actor = getSessionActorEmail(session);
    if (!actor) {
      return NextResponse.json(
        { error: "Oturumda e-posta bulunamadı. Düzenleme için giriş e-postası gerekli." },
        { status: 400 }
      );
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

    // Create update object - only include fields that were provided
    const updateFields: UpdateFields = {
      last_edited_by: actor
    };

    // Copy other fields if they exist (phone_number: her zaman +90 formatında sakla)
    if (updateData.shareholder_name !== undefined) updateFields.shareholder_name = updateData.shareholder_name;
    if (updateData.phone_number !== undefined) {
      const formatted = formatPhoneForDB(updateData.phone_number);
      if (formatted) updateFields.phone_number = formatted;
    }
    if (updateData.email !== undefined) {
      if (updateData.email === null || String(updateData.email).trim() === "") {
        updateFields.email = null;
      } else {
        const trimmed = String(updateData.email).trim();
        const basicEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!basicEmail.test(trimmed)) {
          return NextResponse.json(
            { error: "Geçerli bir e-posta adresi girin" },
            { status: 400 }
          );
        }
        updateFields.email = trimmed;
      }
    }
    if (updateData.second_phone_number !== undefined) {
      if (updateData.second_phone_number === null || updateData.second_phone_number === "") {
        updateFields.second_phone_number = null;
      } else {
        const formatted = formatPhoneForDB(updateData.second_phone_number);
        if (formatted) updateFields.second_phone_number = formatted;
      }
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
          .select("share_price, pricing_mode, live_scale_total_price")
          .eq("sacrifice_id", existing.sacrifice_id)
          .single();

        const { count: shareholderCount, error: countErr } = await supabaseAdmin
          .from("shareholders")
          .select("shareholder_id", { count: "exact" })
          .eq("sacrifice_id", existing.sacrifice_id)
          .limit(0);

        if (countErr) {
          console.error("shareholders count", countErr);
        }

        const n = shareholderCount ?? 0;
        let shareBase = 0;
        if (sacrifice?.pricing_mode === "live_scale") {
          const total = sacrifice.live_scale_total_price != null
            ? Number(sacrifice.live_scale_total_price)
            : null;
          if (total != null && n > 0) {
            shareBase = total / n;
          }
        } else {
          shareBase = Number(sacrifice?.share_price ?? 0);
        }

        const totalAmount = shareBase + deliveryFee;
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

    const { data: rows, error } = await supabaseAdmin.rpc("rpc_update_shareholder", {
      p_actor: actor,
      p_tenant_id: tenantId,
      p_shareholder_id: updateData.shareholder_id,
      p_patch: updateFields as unknown as Record<string, unknown>,
    });

    if (error) {
      console.error("rpc_update_shareholder", error);
      return NextResponse.json(
        { error: "Hissedar güncellenemedi" },
        { status: 500 }
      );
    }

    const list = rows as Record<string, unknown>[] | null;
    if (!list || list.length === 0) {
      return NextResponse.json(
        { error: "Hissedar bulunamadı" },
        { status: 404 }
      );
    }

    const row = list[0];
    const displayMap = await buildEmailToEditorDisplayMap(supabaseAdmin, [
      row.last_edited_by as string | null,
    ]);
    const dataWithDisplay = {
      ...row,
      last_edited_by_display: editorDisplayFromRaw(
        row.last_edited_by as string | null,
        displayMap
      ),
    };

    return NextResponse.json({
      success: true,
      message: "Hissedar güncellendi",
      data: dataWithDisplay,
    });

  } catch {
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
} 