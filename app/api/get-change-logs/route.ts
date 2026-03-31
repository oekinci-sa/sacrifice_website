import { CHANGE_LOG_ROW_UUID_RE } from "@/lib/change-log-labels";
import { editorDisplayFromRaw, buildEmailToEditorDisplayMap } from "@/lib/resolve-editor-display";
import { getTenantId } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId();
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : null;

    // Yıl verilmeden tüm kayıtları döndürme; admin yalnızca seçili yıla göre çeker.
    if (year == null || Number.isNaN(year)) {
      return NextResponse.json({ logs: [] }, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    }

    // Seçili yıla bağlı kayıtlar + sacrifice_year NULL (kullanıcı / user_tenants vb. eski veya yılsız audit)
    const { data, error } = await supabaseAdmin
      .from("change_logs")
      .select("*")
      .eq("tenant_id", tenantId)
      .or(`sacrifice_year.eq.${year},sacrifice_year.is.null`)
      .order("changed_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Değişiklik kayıtları alınamadı" },
        { status: 500 }
      );
    }

    // DB'de change_owner = e-posta veya sistem etiketi; UI'da kullanıcı adı (yoksa e-posta / ham metin)
    const emailToDisplay = await buildEmailToEditorDisplayMap(
      supabaseAdmin,
      (data || []).map((log) => log.change_owner as string | null)
    );

    const logsWithDisplayOwner = (data || []).map((log) => ({
      ...log,
      change_owner: editorDisplayFromRaw(
        log.change_owner as string | null,
        emailToDisplay
      ) || null,
    }));

    const sacTables = new Set(["sacrifice_animals", "mismatched_share_acknowledgments"]);
    const sacrificeIds = new Set<string>();
    for (const log of logsWithDisplayOwner) {
      const tn = log.table_name as string;
      if (!sacTables.has(tn)) continue;
      const rid = String(log.row_id ?? "").trim();
      if (CHANGE_LOG_ROW_UUID_RE.test(rid)) sacrificeIds.add(rid);
    }

    let sacrificeNoById = new Map<string, number>();
    if (sacrificeIds.size > 0) {
      const { data: animals } = await supabaseAdmin
        .from("sacrifice_animals")
        .select("sacrifice_id, sacrifice_no")
        .eq("tenant_id", tenantId)
        .in("sacrifice_id", Array.from(sacrificeIds));

      sacrificeNoById = new Map(
        (animals ?? []).map((a) => [a.sacrifice_id as string, a.sacrifice_no as number])
      );
    }

    const logsEnriched = logsWithDisplayOwner.map((log) => {
      const tn = log.table_name as string;
      if (!sacTables.has(tn)) {
        return { ...log, row_id_label: null as string | null };
      }
      const rid = String(log.row_id ?? "").trim();
      if (!CHANGE_LOG_ROW_UUID_RE.test(rid)) {
        return { ...log, row_id_label: null as string | null };
      }
      const no = sacrificeNoById.get(rid);
      if (no == null) {
        return { ...log, row_id_label: null as string | null };
      }
      return {
        ...log,
        row_id_label: `Kurbanlık No: ${no}`,
      };
    });

    const shareholderIds = new Set<string>();
    for (const log of logsEnriched) {
      if (log.table_name !== "shareholders") continue;
      const rid = String(log.row_id ?? "").trim();
      if (CHANGE_LOG_ROW_UUID_RE.test(rid)) shareholderIds.add(rid);
    }

    let shareholderNameById = new Map<string, string>();
    if (shareholderIds.size > 0) {
      const { data: shs } = await supabaseAdmin
        .from("shareholders")
        .select("shareholder_id, shareholder_name")
        .eq("tenant_id", tenantId)
        .in("shareholder_id", Array.from(shareholderIds));

      shareholderNameById = new Map(
        (shs ?? []).map((s) => [s.shareholder_id as string, String(s.shareholder_name ?? "")])
      );
    }

    const logsFinal = logsEnriched.map((log) => {
      if (log.table_name !== "shareholders") return log;
      const rid = String(log.row_id ?? "").trim();
      if (!CHANGE_LOG_ROW_UUID_RE.test(rid)) return log;
      const name = shareholderNameById.get(rid);
      if (!name) return log;
      return { ...log, row_id_label: name };
    });

    return NextResponse.json({ logs: logsFinal }, {
      headers: { 
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch {
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
} 