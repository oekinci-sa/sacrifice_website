/**
 * GET /api/admin/sms/originators
 * Onaylı SMS başlıklarını (originator) sorgular.
 * Yalnızca super_admin rolü erişebilir.
 */
import { authOptions } from "@/lib/auth";
import { getTenantId } from "@/lib/tenant";
import { getSmsCredentials } from "@/lib/sms-config";
import { queryOriginators } from "@/lib/sms-client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "super_admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const tenantId = getTenantId();
    const credentials = getSmsCredentials(tenantId);
    if (!credentials) {
      return NextResponse.json(
        { error: "SMS API yapılandırması eksik" },
        { status: 503 }
      );
    }

    const result = await queryOriginators(credentials);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message },
        { status: result.code === "NETWORK" ? 503 : 422 }
      );
    }

    return NextResponse.json({ originators: result.originators });
  } catch (e) {
    console.error("[sms/originators]", e);
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 });
  }
}
