import { authOptions } from "@/lib/auth";
import { hashQueueCode, isPageKey, PAGE_KEYS } from "@/lib/queue-access-hash";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getTenantId } from "@/lib/tenant";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && role !== "super_admin") return null;
  return session;
}

/** GET /api/admin/security/queue-codes — her page_key için şifre set mi? */
export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const tenantId = getTenantId();

  const { data, error } = await supabaseAdmin
    .from("queue_page_access_codes")
    .select("page_key, updated_at, updated_by")
    .eq("tenant_id", tenantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: NO_CACHE });
  }

  const result = PAGE_KEYS.map((key) => {
    const row = data?.find((r) => r.page_key === key);
    return {
      page_key: key,
      is_set: !!row,
      updated_at: row?.updated_at ?? null,
      updated_by: row?.updated_by ?? null,
    };
  });

  return NextResponse.json({ codes: result }, { headers: NO_CACHE });
}

const putSchema = z.object({
  pageKey: z.string().refine(isPageKey, { message: "Geçersiz sayfa anahtarı" }),
  code: z.string().regex(/^\d{6}$/, { message: "Şifre 6 haneli rakamdan oluşmalı" }),
});

/** PUT /api/admin/security/queue-codes — PIN ayarla veya güncelle */
export async function PUT(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Geçersiz veri" },
      { status: 400 }
    );
  }

  const { pageKey, code } = parsed.data;
  const tenantId = getTenantId();
  const userName = (session.user as { name?: string }).name ?? "Admin";

  const codeHash = hashQueueCode(code);

  const { error } = await supabaseAdmin.from("queue_page_access_codes").upsert(
    {
      tenant_id: tenantId,
      page_key: pageKey,
      code_hash: codeHash,
      updated_by: userName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id,page_key" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { headers: NO_CACHE });
}
