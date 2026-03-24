import {
  GOLBASI_TENANT_ID,
  resolveTenantIdFromHost,
} from "@/lib/tenant-resolver";
import { primaryHostFromHeaders } from "@/lib/tenant";
import { readFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export const dynamic = "force-dynamic";

function resolveTenantIdForIcon(request: NextRequest): string | null {
  const fromMiddleware = request.headers.get("x-tenant-id");
  if (fromMiddleware) return fromMiddleware;
  const host = primaryHostFromHeaders(request.headers);
  return resolveTenantIdFromHost(host);
}

function publicSvgPathForTenant(tenantId: string | null): string {
  if (tenantId === GOLBASI_TENANT_ID) {
    return path.join(
      process.cwd(),
      "public",
      "logos",
      "elya-hayvancilik",
      "elya-hayvancilik.svg"
    );
  }
  return path.join(
    process.cwd(),
    "public",
    "logos",
    "ankara-kurban",
    "ankara-kurban-circular.svg"
  );
}

/**
 * Sekme / Google favicon: host veya x-tenant-id ile tenant’a göre SVG döner.
 * (Eski statik app/icon.svg tek tenant’tı; çakışmayı kaldırdık.)
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveTenantIdForIcon(request);
    const filePath = publicSvgPathForTenant(tenantId);
    const body = await readFile(filePath);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
