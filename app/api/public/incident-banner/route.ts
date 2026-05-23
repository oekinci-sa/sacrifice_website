import { getTenantIdFromHeaders } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromHeaders(request.headers);

    const { data, error } = await supabaseAdmin
      .from("tenant_settings")
      .select("incident_banner_enabled, incident_banner_message")
      .eq("tenant_id", tenantId)
      .single();

    if (error) {
      return NextResponse.json(
        { incident_banner_enabled: false, incident_banner_message: "" },
        { headers: NO_CACHE }
      );
    }

    return NextResponse.json(
      {
        incident_banner_enabled: data?.incident_banner_enabled ?? false,
        incident_banner_message: data?.incident_banner_message ?? "",
      },
      { headers: NO_CACHE }
    );
  } catch {
    return NextResponse.json(
      { incident_banner_enabled: false, incident_banner_message: "" },
      { headers: NO_CACHE }
    );
  }
}
