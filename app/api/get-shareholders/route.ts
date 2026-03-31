import { buildEmailToEditorDisplayMap, editorDisplayFromRaw } from "@/lib/resolve-editor-display";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId();
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : null;

    let query = supabaseAdmin
      .from("shareholders")
      .select(`
        *,
        sacrifice:sacrifice_animals (
          sacrifice_id,
          sacrifice_no,
          sacrifice_time,
          planned_delivery_time,
          share_price,
          share_weight,
          pricing_mode,
          live_scale_total_kg,
          live_scale_total_price
        )
      `)
      .eq("tenant_id", tenantId)
      .order("purchase_time", { ascending: false });

    if (year != null && !Number.isNaN(year)) {
      query = query.eq("sacrifice_year", year);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Hissedarlar alınamadı" },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    const displayMap = await buildEmailToEditorDisplayMap(
      supabaseAdmin,
      (data || []).map((r) => r.last_edited_by as string | null)
    );
    const shareholders = (data || []).map((row) => ({
      ...row,
      last_edited_by_display: editorDisplayFromRaw(
        row.last_edited_by as string | null,
        displayMap
      ),
    }));

    return NextResponse.json({ shareholders }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
} 