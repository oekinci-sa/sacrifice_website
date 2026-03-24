import { getTenantFaviconResponse } from "@/lib/tenant-favicon";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** Google ve eski istemciler; içerik `/icon` ile aynı (SVG), `Vary: Host` lib’de. */
export async function GET(request: NextRequest) {
  return getTenantFaviconResponse(request);
}
