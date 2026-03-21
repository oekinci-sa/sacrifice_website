import { authOptions } from '@/lib/auth';
import {
    getSessionActorEmail,
    sessionHasAdminEditorOrSuperRole,
} from '@/lib/admin-editor-session';
import { getTenantId } from '@/lib/tenant';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STAGES = ['slaughter_stage', 'butcher_stage', 'delivery_stage'] as const;

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!sessionHasAdminEditorOrSuperRole(session)) {
            return NextResponse.json(
                { error: 'Yetkisiz' },
                {
                    status: 401,
                    headers: {
                        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                }
            );
        }

        const actor = getSessionActorEmail(session);
        if (!actor) {
            return NextResponse.json(
                { error: 'Oturumda e-posta bulunamadı.' },
                {
                    status: 400,
                    headers: {
                        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                }
            );
        }

        const tenantId = getTenantId();
        const body = await request.json();
        const { stage, current_sacrifice_number } = body;

        if (!stage || current_sacrifice_number === undefined) {
            return NextResponse.json(
                { error: 'Aşama ve current_sacrifice_number gerekli' },
                {
                    status: 400,
                    headers: {
                        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                }
            );
        }

        if (typeof stage !== 'string' || !STAGES.includes(stage as typeof STAGES[number])) {
            return NextResponse.json(
                { error: 'Geçersiz aşama' },
                {
                    status: 400,
                    headers: {
                        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                }
            );
        }

        const num = Number(current_sacrifice_number);
        if (!Number.isInteger(num) || num < 0 || num > 32767) {
            return NextResponse.json(
                { error: 'Geçersiz kurban numarası' },
                {
                    status: 400,
                    headers: {
                        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                }
            );
        }

        const { data: rows, error } = await supabaseAdmin.rpc('rpc_update_stage_metrics', {
            p_actor: actor,
            p_tenant_id: tenantId,
            p_stage: stage,
            p_current_sacrifice_number: num,
        });

        if (error) {
            console.error('rpc_update_stage_metrics', error);
            const msg = error.message ?? '';
            if (msg.includes('stage_metrics_not_found')) {
                return NextResponse.json(
                    { error: 'Aşama metrik kaydı bulunamadı' },
                    {
                        status: 404,
                        headers: {
                            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                            'Pragma': 'no-cache',
                            'Expires': '0'
                        }
                    }
                );
            }
            return NextResponse.json(
                { error: 'Aşama metrikleri güncellenemedi' },
                {
                    status: 500,
                    headers: {
                        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                }
            );
        }

        const list = rows as unknown[] | null;
        if (!list || list.length === 0) {
            return NextResponse.json(
                { error: 'Aşama metrik kaydı bulunamadı' },
                {
                    status: 404,
                    headers: {
                        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                }
            );
        }

        return NextResponse.json(list, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch {
        return NextResponse.json(
            { error: 'Beklenmeyen bir sunucu hatası oluştu' },
            {
                status: 500,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            }
        );
    }
}
