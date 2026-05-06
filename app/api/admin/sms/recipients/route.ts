/**
 * GET /api/admin/sms/recipients
 *
 * SMS alıcılarını döner (hissedarlar — phone_number'a göre, yıl ve kurban bazlı filtre).
 * Params:
 *   year               — sacrifice_year (zorunlu)
 *   sacrificeId        — belirli kurbanlık UUID (opsiyonel)
 *   sacrificeNo        — belirli kurban numarası (tek hayvan)
 *   sacrificeNos       — birden fazla kurban no, virgülle (örn. 5,12,87)
 *   sacrificeNoFrom    — Kurban no aralığı başlangıcı (sacrificeNoTo ile birlikte)
 *   sacrificeNoTo      — Kurban no aralığı sonu
 *   afterSacrificeNo   — bu hayvan no'sundan **büyük** hayvanların hissedarları (sınır dışı)
 */
import { authOptions } from "@/lib/auth";
import { getTenantId } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isValidPhone } from "@/lib/sms-phone-normalizer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = new Set(["admin", "editor", "super_admin"]);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !ADMIN_ROLES.has(session.user.role)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const sp = request.nextUrl.searchParams;
    const yearParam = sp.get("year");
    const sacrificeYear = yearParam ? parseInt(yearParam, 10) : NaN;
    if (!Number.isFinite(sacrificeYear) || sacrificeYear < 2000 || sacrificeYear > 2100) {
      return NextResponse.json(
        { error: "Geçerli bir yıl sorgu parametresi gerekli (?year=2026)" },
        { status: 400 }
      );
    }

    const sacrificeIdParam = sp.get("sacrificeId");
    const sacrificeNoParam = sp.get("sacrificeNo");
    const sacrificeNosParam = sp.get("sacrificeNos");
    const sacrificeNoFrom = sp.get("sacrificeNoFrom");
    const sacrificeNoTo = sp.get("sacrificeNoTo");
    const afterSacrificeNo = sp.get("afterSacrificeNo");
    const tenantId = getTenantId();

    /** Aralık veya tek numara ile filtre: ilgili sacrifice_id kümesi */
    let filterSacrificeIds: Set<string> | null = null;
    /** sacrificeNos isteğinde bazı numaralar DB'de yoksa bilgi mesajı */
    let sacrificeNosPartialInfo: string | undefined;

    if (sacrificeNoFrom != null && sacrificeNoTo != null) {
      const fromN = parseInt(sacrificeNoFrom, 10);
      const toN = parseInt(sacrificeNoTo, 10);
      if (!Number.isFinite(fromN) || !Number.isFinite(toN)) {
        return NextResponse.json(
          { error: "sacrificeNoFrom ve sacrificeNoTo geçerli sayılar olmalı" },
          { status: 400 }
        );
      }
      if (fromN > toN) {
        return NextResponse.json(
          { error: "Kurban no aralığı: başlangıç bitişten büyük olamaz" },
          { status: 400 }
        );
      }
      const { data: sacs } = await supabaseAdmin
        .from("sacrifice_animals")
        .select("sacrifice_id")
        .eq("tenant_id", tenantId)
        .eq("sacrifice_year", sacrificeYear)
        .gte("sacrifice_no", fromN)
        .lte("sacrifice_no", toN);

      filterSacrificeIds = new Set(
        (sacs ?? []).map((s: { sacrifice_id: string }) => s.sacrifice_id)
      );
    } else if (sacrificeNosParam != null && sacrificeNosParam.trim()) {
      const rawNums = sacrificeNosParam
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n));
      const nums = Array.from(new Set(rawNums)).sort((a, b) => a - b);
      if (nums.length === 0) {
        return NextResponse.json(
          { error: "sacrificeNos içinde geçerli kurban numarası yok" },
          { status: 400 }
        );
      }
      const { data: sacs } = await supabaseAdmin
        .from("sacrifice_animals")
        .select("sacrifice_id, sacrifice_no")
        .eq("tenant_id", tenantId)
        .eq("sacrifice_year", sacrificeYear)
        .in("sacrifice_no", nums);

      const found = sacs ?? [];
      filterSacrificeIds = new Set(
        found.map((s: { sacrifice_id: string }) => s.sacrifice_id)
      );
      const foundNos = new Set(
        found.map((r: { sacrifice_no: number }) => r.sacrifice_no)
      );
      const missingNos = nums.filter((n) => !foundNos.has(n));

      if (filterSacrificeIds.size === 0) {
        return NextResponse.json({
          recipients: [],
          sacrificeYear,
          message:
            missingNos.length > 0
              ? `Bu numaralarda kurbanlık yok: ${missingNos.join(", ")}`
              : "Seçilen kurban numaralarında kayıt bulunamadı",
        });
      }
      if (missingNos.length > 0) {
        sacrificeNosPartialInfo = `Bu numaralarda kurbanlık kaydı yok (yok sayıldı): ${missingNos.join(", ")}`;
      }
    } else if (sacrificeNoParam) {
      const n = parseInt(sacrificeNoParam, 10);
      if (!Number.isFinite(n)) {
        return NextResponse.json(
          { error: "sacrificeNo geçerli bir sayı olmalı" },
          { status: 400 }
        );
      }
      const { data: one } = await supabaseAdmin
        .from("sacrifice_animals")
        .select("sacrifice_id")
        .eq("tenant_id", tenantId)
        .eq("sacrifice_year", sacrificeYear)
        .eq("sacrifice_no", n)
        .maybeSingle();

      if (!one?.sacrifice_id) {
        return NextResponse.json({ recipients: [], sacrificeYear, message: "Bu numarada kurbanlık yok" });
      }
      filterSacrificeIds = new Set([one.sacrifice_id as string]);
    }

    let query = supabaseAdmin
      .from("shareholders")
      .select(
        `shareholder_id, shareholder_name, phone_number, second_phone_number, sacrifice_id, remaining_payment, delivery_type, delivery_location,
         sacrifice:sacrifice_animals(sacrifice_no)`
      )
      .eq("tenant_id", tenantId)
      .eq("sacrifice_year", sacrificeYear)
      .order("purchase_time", { ascending: true });

    if (sacrificeIdParam) {
      query = query.eq("sacrifice_id", sacrificeIdParam);
    }

    const { data: shareholders, error: shError } = await query;
    if (shError) {
      console.error("[sms/recipients]", shError);
      return NextResponse.json({ error: "Hissedarlar alınamadı" }, { status: 500 });
    }

    let eligibleSacrificeIds: Set<string> | null = null;

    if (filterSacrificeIds !== null) {
      eligibleSacrificeIds = filterSacrificeIds;
    }

    if (afterSacrificeNo && !sacrificeIdParam) {
      const afterNo = parseInt(afterSacrificeNo, 10);
      if (Number.isFinite(afterNo)) {
        const { data: sacrifices } = await supabaseAdmin
          .from("sacrifice_animals")
          .select("sacrifice_id, sacrifice_no")
          .eq("tenant_id", tenantId)
          .eq("sacrifice_year", sacrificeYear)
          .gt("sacrifice_no", afterNo);

        const afterSet = new Set(
          (sacrifices ?? []).map((s: { sacrifice_id: string }) => s.sacrifice_id)
        );
        if (eligibleSacrificeIds !== null) {
          eligibleSacrificeIds = new Set(
            Array.from(eligibleSacrificeIds).filter((id) => afterSet.has(id))
          );
        } else {
          eligibleSacrificeIds = afterSet;
        }
      }
    }

    const rows = (shareholders ?? [])
      .filter((sh) => {
        if (eligibleSacrificeIds !== null) {
          return eligibleSacrificeIds.has(sh.sacrifice_id as string);
        }
        return true;
      })
      .map((sh) => {
        const sac = sh.sacrifice as { sacrifice_no?: number } | null;
        const sacrificeNo =
          sac?.sacrifice_no != null && Number.isFinite(sac.sacrifice_no)
            ? sac.sacrifice_no
            : null;
        const name = (sh.shareholder_name as string) ?? "";
        return {
          shareholder_id: sh.shareholder_id as string,
          shareholder_name: name,
          /** SMS arayüzü ve gönderim satırı ile uyum (recipient_name) */
          recipient_name: name,
          phone_number: (sh.phone_number as string | null) ?? "",
          second_phone_number: (sh.second_phone_number as string | null) ?? null,
          sacrifice_id: sh.sacrifice_id as string,
          sacrifice_no: sacrificeNo,
          remaining_payment: (sh.remaining_payment as number) ?? 0,
          delivery_type: (sh.delivery_type as string) ?? "",
          delivery_location: (sh.delivery_location as string) ?? "",
          has_valid_phone: isValidPhone(sh.phone_number as string | null),
        };
      });

    return NextResponse.json(
      {
        recipients: rows,
        sacrificeYear,
        ...(sacrificeNosPartialInfo ? { message: sacrificeNosPartialInfo } : {}),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[sms/recipients]", e);
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}
