import { isPageKey } from "@/lib/queue-access-hash";
import { getTenantId } from "@/lib/tenant";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getSecret(): Uint8Array {
  const s = process.env.QUEUE_ACCESS_SECRET;
  if (!s) throw new Error("QUEUE_ACCESS_SECRET is not set");
  return new TextEncoder().encode(s);
}

/** GET /api/queue-access/check?pageKey=slaughter */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const pageKey = req.nextUrl.searchParams.get("pageKey");
  if (!pageKey || !isPageKey(pageKey)) {
    return NextResponse.json({ valid: false, error: "Geçersiz sayfa anahtarı" }, { status: 400 });
  }

  const tenantId = getTenantId();
  const cookieStore = await cookies();
  const token = cookieStore.get(`qa_token_${pageKey}`)?.value;

  if (!token) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.pageKey !== pageKey || payload.tenantId !== tenantId) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }
    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json({ valid: false }, { status: 401 });
  }
}
