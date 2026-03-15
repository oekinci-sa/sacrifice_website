import { authOptions } from "@/lib/auth";
import { getDefaultSacrificeYear } from "@/lib/constants/sacrifice-year";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/sacrifices/[id] - Kurbanlığı ve ilişkili hissedarları siler
 * Sadece admin yetkisi gerekir
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "super_admin")) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const tenantId = getTenantId();
    const sacrificeYear = getDefaultSacrificeYear();
    const { id: sacrificeId } = await params;

    if (!sacrificeId) {
      return NextResponse.json(
        { error: "sacrifice_id gerekli" },
        { status: 400 }
      );
    }

    // Önce kurbanlığın bu tenant'a ait olduğunu doğrula
    const { data: sacrifice, error: fetchError } = await supabaseAdmin
      .from("sacrifice_animals")
      .select("sacrifice_id")
      .eq("sacrifice_id", sacrificeId)
      .eq("tenant_id", tenantId)
      .eq("sacrifice_year", sacrificeYear)
      .single();

    if (fetchError || !sacrifice) {
      return NextResponse.json(
        { error: "Kurbanlık bulunamadı veya erişim yok" },
        { status: 404 }
      );
    }

    // Önce hissedarları sil (foreign key cascade yoksa)
    await supabaseAdmin
      .from("shareholders")
      .delete()
      .eq("sacrifice_id", sacrificeId)
      .eq("tenant_id", tenantId);

    // Rezervasyonları sil
    await supabaseAdmin
      .from("reservation_transactions")
      .delete()
      .eq("sacrifice_id", sacrificeId)
      .eq("tenant_id", tenantId);

    // Kurbanlığı sil
    const { error: deleteError } = await supabaseAdmin
      .from("sacrifice_animals")
      .delete()
      .eq("sacrifice_id", sacrificeId)
      .eq("tenant_id", tenantId)
      .eq("sacrifice_year", sacrificeYear);

    if (deleteError) {
      return NextResponse.json(
        { error: "Kurbanlık silinirken hata oluştu" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
