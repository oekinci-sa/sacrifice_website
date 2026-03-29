import { primaryHostFromHeaders } from "@/lib/tenant";
import {
  GOLBASI_TENANT_ID,
  resolveTenantIdFromHost,
} from "@/lib/tenant-resolver";
import { readFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

/** Edge/CDN aynı path için Host’a göre ayrı önbellek tutsun (tenant karışmasın). */
const FAVICON_HEADERS = {
  "Content-Type": "image/svg+xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
  Vary: "Host",
} as const;

const FAVICON_PNG_HEADERS = {
  "Content-Type": "image/png",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
  Vary: "Host",
} as const;

export function resolveTenantIdForFavicon(request: NextRequest): string | null {
  const fromMiddleware = request.headers.get("x-tenant-id");
  if (fromMiddleware) return fromMiddleware;
  const host = primaryHostFromHeaders(request.headers);
  return resolveTenantIdFromHost(host);
}

function publicFaviconFileForTenant(tenantId: string | null): {
  filePath: string;
  headers: typeof FAVICON_HEADERS | typeof FAVICON_PNG_HEADERS;
} {
  if (tenantId === GOLBASI_TENANT_ID) {
    return {
      filePath: path.join(
        process.cwd(),
        "public",
        "logos",
        "elya-hayvancilik",
        "elya-hayvancilik-circular.png"
      ),
      headers: FAVICON_PNG_HEADERS,
    };
  }
  return {
    filePath: path.join(
      process.cwd(),
      "public",
      "logos",
      "ankara-kurban",
      "ankara-kurban-circular.svg"
    ),
    headers: FAVICON_HEADERS,
  };
}

/** `/icon` ve `/favicon.ico` ortak: tenant’a göre dosya (Elya: PNG dairesel; diğer: SVG). */
export async function getTenantFaviconResponse(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const tenantId = resolveTenantIdForFavicon(request);
    const { filePath, headers } = publicFaviconFileForTenant(tenantId);
    const buf = await readFile(filePath);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers,
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
