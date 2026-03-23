import { authOptions } from "@/lib/auth";
import { getSessionActorEmail, sessionHasAdminEditorOrSuperRole } from "@/lib/admin-editor-session";
import { mapMoveShareholderRpcError } from "@/lib/map-move-shareholder-error";
import { buildEmailToEditorDisplayMap, editorDisplayFromRaw } from "@/lib/resolve-editor-display";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function fetchShareholderWithSacrificeDisplay(shareholderId: string, tenantId: string) {
  const { data, error } = await supabaseAdmin
    .from("shareholders")
    .select(`
        *,
        sacrifice:sacrifice_animals (
          sacrifice_id,
          sacrifice_no,
          sacrifice_time,
          share_price,
          share_weight
        )
      `)
    .eq("shareholder_id", shareholderId)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !data) {
    return { error: "Hissedar bulunamadı" as const, status: 404 as const };
  }

  const displayMap = await buildEmailToEditorDisplayMap(supabaseAdmin, [
    data.last_edited_by as string | null,
  ]);
  return {
    data: {
      ...data,
      last_edited_by_display: editorDisplayFromRaw(
        data.last_edited_by as string | null,
        displayMap
      ),
    },
  };
}

/**
 * POST /api/admin/shareholders/[id]/move-sacrifice
 * Body: { target_sacrifice_no: number }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id: shareholderId } = await params;
    let body: { target_sacrifice_no?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
    }

    const rawNo = body.target_sacrifice_no;
    const targetSacrificeNo =
      typeof rawNo === "number" && Number.isFinite(rawNo)
        ? rawNo
        : typeof rawNo === "string" && rawNo.trim() !== ""
          ? Number.parseInt(rawNo, 10)
          : NaN;

    if (!Number.isFinite(targetSacrificeNo) || targetSacrificeNo < 1) {
      return NextResponse.json(
        { error: "Geçerli bir kurban sıra numarası girin." },
        { status: 400 }
      );
    }

    const { data: shRow, error: shErr } = await supabaseAdmin
      .from("shareholders")
      .select("sacrifice_year, sacrifice_id")
      .eq("shareholder_id", shareholderId)
      .eq("tenant_id", tenantId)
      .single();

    if (shErr || !shRow) {
      return NextResponse.json({ error: "Hissedar bulunamadı" }, { status: 404 });
    }

    const sacrificeYear = shRow.sacrifice_year as number;

    const { data: targetAnimal, error: tgtErr } = await supabaseAdmin
      .from("sacrifice_animals")
      .select("sacrifice_id")
      .eq("tenant_id", tenantId)
      .eq("sacrifice_year", sacrificeYear)
      .eq("sacrifice_no", targetSacrificeNo)
      .maybeSingle();

    if (tgtErr || !targetAnimal?.sacrifice_id) {
      return NextResponse.json(
        { error: "Bu sıra numarasına ait kurbanlık bulunamadı." },
        { status: 400 }
      );
    }

    const pTargetSacrificeId = targetAnimal.sacrifice_id as string;

    const { error: rpcError } = await supabaseAdmin.rpc("rpc_move_shareholder_to_sacrifice", {
      p_actor: actor,
      p_tenant_id: tenantId,
      p_shareholder_id: shareholderId,
      p_target_sacrifice_id: pTargetSacrificeId,
    });

    if (rpcError) {
      console.error("rpc_move_shareholder_to_sacrifice", rpcError);
      const msg = mapMoveShareholderRpcError(rpcError.message || "");
      const status =
        rpcError.message?.includes("not_found") || rpcError.message?.includes("missing")
          ? 404
          : 400;
      return NextResponse.json({ error: msg }, { status });
    }

    const result = await fetchShareholderWithSacrificeDisplay(shareholderId, tenantId);
    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      message: "Hissedar hedef kurbanlığa taşındı",
      data: result.data,
    });
  } catch (e) {
    console.error("move-sacrifice", e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
