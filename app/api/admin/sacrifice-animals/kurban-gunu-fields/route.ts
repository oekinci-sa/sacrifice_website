import { authOptions } from "@/lib/auth";
import {
  getSessionActorEmail,
  sessionHasAdminEditorOrSuperRole,
} from "@/lib/admin-editor-session";
import { getDefaultSacrificeYear } from "@/lib/constants/sacrifice-year";
import { parseDecimalInput } from "@/lib/decimal-input";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TIME_FIELDS = ["slaughter_time", "butcher_time", "delivery_time"] as const;
type TimeField = (typeof TIME_FIELDS)[number];

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!sessionHasAdminEditorOrSuperRole(session)) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401, headers: NO_STORE_HEADERS });
    }

    const actor = getSessionActorEmail(session);
    if (!actor) {
      return NextResponse.json(
        { error: "Oturumda e-posta bulunamadı." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const tenantId = getTenantId();
    const body = await request.json();
    const {
      sacrifice_id,
      sacrifice_year: bodyYear,
      delivered_share_kg,
      delivery_notes,
    } = body;

    if (!sacrifice_id || typeof sacrifice_id !== "string") {
      return NextResponse.json(
        { error: "sacrifice_id gerekli" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const sacrificeYear = bodyYear != null ? Number(bodyYear) : getDefaultSacrificeYear();

    const patch: Record<string, unknown> = {
      last_edited_by: actor,
      last_edited_time: new Date().toISOString(),
    };

    for (const field of TIME_FIELDS) {
      const value = body[field as TimeField];
      if (value !== undefined) {
        if (value === null || value === "") {
          patch[field] = null;
        } else if (typeof value === "string") {
          patch[field] = value;
        } else {
          return NextResponse.json(
            { error: `${field} geçersiz` },
            { status: 400, headers: NO_STORE_HEADERS }
          );
        }
      }
    }

    if (delivered_share_kg !== undefined) {
      if (delivered_share_kg === null || delivered_share_kg === "") {
        patch.delivered_share_kg = null;
      } else {
        const kg = parseDecimalInput(delivered_share_kg);
        if (kg === null || kg < 0) {
          return NextResponse.json(
            { error: "Teslim edilen kg geçersiz" },
            { status: 400, headers: NO_STORE_HEADERS }
          );
        }
        patch.delivered_share_kg = kg;
      }
    }

    if (delivery_notes !== undefined) {
      patch.delivery_notes =
        delivery_notes === null || delivery_notes === ""
          ? null
          : String(delivery_notes);
    }

    const patchKeys = Object.keys(patch).filter(
      (k) => k !== "last_edited_by" && k !== "last_edited_time"
    );
    if (patchKeys.length === 0) {
      return NextResponse.json(
        { error: "Güncellenecek alan bulunamadı" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const { data, error } = await supabaseAdmin.rpc("rpc_update_sacrifice_core", {
      p_actor: actor,
      p_tenant_id: tenantId,
      p_sacrifice_id: sacrifice_id,
      p_sacrifice_year: sacrificeYear,
      p_patch: patch,
    });

    if (error) {
      console.error("rpc_update_sacrifice_core (kurban-gunu-fields)", error);
      return NextResponse.json(
        { error: "Kurban alanı güncellenemedi" },
        { status: 500, headers: NO_STORE_HEADERS }
      );
    }

    const list = data as Record<string, unknown>[] | null;
    if (!list || list.length === 0) {
      return NextResponse.json(
        { error: "Kurban kaydı bulunamadı" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(list[0], { headers: NO_STORE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Beklenmeyen bir sunucu hatası oluştu" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
