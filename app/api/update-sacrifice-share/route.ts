import { authOptions } from '@/lib/auth';
import { getSessionActorEmail, HISSE_AL_AKISI_ACTOR } from '@/lib/admin-editor-session';
import { getDefaultSacrificeYear } from '@/lib/constants/sacrifice-year';
import { getTenantId } from '@/lib/tenant';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const actor = getSessionActorEmail(session) ?? HISSE_AL_AKISI_ACTOR;

    const tenantId = getTenantId();
    const sacrificeYear = getDefaultSacrificeYear();
    const { sacrificeId, emptyShare } = await request.json();

    // Validate input
    if (!sacrificeId) {
      return NextResponse.json(
        { error: "sacrifice_id gerekli" },
        { status: 400 }
      );
    }

    if (typeof emptyShare !== 'number') {
      return NextResponse.json(
        { error: "empty_share sayı olmalıdır" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin.rpc("rpc_update_sacrifice_core", {
      p_actor: actor,
      p_tenant_id: tenantId,
      p_sacrifice_id: sacrificeId,
      p_sacrifice_year: sacrificeYear,
      p_patch: {
        empty_share: emptyShare,
        last_edited_by: actor,
        last_edited_time: now,
      },
    });

    if (error) {
      console.error("rpc_update_sacrifice_core (empty_share)", error);
      return NextResponse.json(
        { error: "Boş hisse güncellenemedi" },
        { status: 500 }
      );
    }

    const list = data as unknown[] | null;
    if (!list || list.length === 0) {
      return NextResponse.json({ error: "Kurban kaydı bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(list);
  } catch {
    return NextResponse.json(
      { error: "Beklenmeyen bir sunucu hatası oluştu" },
      { status: 500 }
    );
  }
} 