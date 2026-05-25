import { hashIp, hashQueueCode, isPageKey } from "@/lib/queue-access-hash";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getTenantId } from "@/lib/tenant";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 10;
const TOKEN_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 saat

const bodySchema = z.object({
  pageKey: z.string(),
  code: z.string().regex(/^\d{6}$/),
});

function getSecret(): Uint8Array {
  const s = process.env.QUEUE_ACCESS_SECRET;
  if (!s) throw new Error("QUEUE_ACCESS_SECRET is not set");
  return new TextEncoder().encode(s);
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success || !isPageKey(parsed.data.pageKey)) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const { pageKey, code } = parsed.data;
  const tenantId = getTenantId();
  const ipHash = hashIp(getClientIp(req));

  // Rate limit kontrolü
  const { data: attemptRow } = await supabaseAdmin
    .from("queue_page_access_attempts")
    .select("failed_count, locked_until")
    .eq("tenant_id", tenantId)
    .eq("page_key", pageKey)
    .eq("ip_hash", ipHash)
    .maybeSingle();

  if (attemptRow?.locked_until) {
    const lockedUntil = new Date(attemptRow.locked_until);
    if (lockedUntil > new Date()) {
      const remainingMs = lockedUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      return NextResponse.json(
        {
          error: `Çok fazla hatalı deneme. ${remainingMin} dakika sonra tekrar deneyin.`,
          locked: true,
          locked_until: attemptRow.locked_until,
        },
        { status: 429 }
      );
    }
  }

  // Şifre hash'ini DB'den al
  const { data: codeRow, error: codeErr } = await supabaseAdmin
    .from("queue_page_access_codes")
    .select("code_hash")
    .eq("tenant_id", tenantId)
    .eq("page_key", pageKey)
    .maybeSingle();

  if (codeErr) {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }

  if (!codeRow?.code_hash) {
    // Sayfa için şifre henüz ayarlanmamış — erişime izin ver
    await setAccessCookie(pageKey, tenantId);
    return NextResponse.json({ success: true });
  }

  const submittedHash = hashQueueCode(code);
  const isCorrect = submittedHash === codeRow.code_hash;

  if (isCorrect) {
    // Başarılı: rate limit sıfırla
    await supabaseAdmin.from("queue_page_access_attempts").upsert(
      {
        tenant_id: tenantId,
        page_key: pageKey,
        ip_hash: ipHash,
        failed_count: 0,
        locked_until: null,
        last_attempt_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id,page_key,ip_hash" }
    );

    await setAccessCookie(pageKey, tenantId);
    return NextResponse.json({ success: true });
  }

  // Başarısız: sayacı artır
  const newCount = (attemptRow?.failed_count ?? 0) + 1;
  const lockedUntil =
    newCount >= MAX_ATTEMPTS
      ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString()
      : null;

  await supabaseAdmin.from("queue_page_access_attempts").upsert(
    {
      tenant_id: tenantId,
      page_key: pageKey,
      ip_hash: ipHash,
      failed_count: newCount,
      locked_until: lockedUntil,
      last_attempt_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id,page_key,ip_hash" }
  );

  if (newCount >= MAX_ATTEMPTS) {
    return NextResponse.json(
      {
        error: `Çok fazla hatalı deneme. ${LOCKOUT_MINUTES} dakika sonra tekrar deneyin.`,
        locked: true,
        locked_until: lockedUntil,
      },
      { status: 429 }
    );
  }

  const remaining = MAX_ATTEMPTS - newCount;
  return NextResponse.json(
    { error: `Hatalı şifre. ${remaining} deneme hakkınız kaldı.` },
    { status: 401 }
  );
}

async function setAccessCookie(pageKey: string, tenantId: string): Promise<void> {
  const token = await new SignJWT({ tenantId, pageKey })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_MAX_AGE_SECONDS}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(`qa_token_${pageKey}`, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
}
