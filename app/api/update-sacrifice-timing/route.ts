import { authOptions } from '@/lib/auth';
import {
    getSessionActorEmail,
    TAKIP_EKRANI_ACTOR,
} from '@/lib/admin-editor-session';
import { getDefaultSacrificeYear } from '@/lib/constants/sacrifice-year';
import { getTenantId } from '@/lib/tenant';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const actor =
            getSessionActorEmail(session) ?? TAKIP_EKRANI_ACTOR;

        const tenantId = getTenantId();
        const sacrificeYear = getDefaultSacrificeYear();
        const body = await request.json();
        const { sacrifice_id, stage, is_completed } = body;

        if (!sacrifice_id || !stage) {
            return NextResponse.json(
                { error: "sacrifice_id ve stage gerekli" },
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

        // Determine which field to update based on stage
        let timeField: 'slaughter_time' | 'butcher_time' | 'delivery_time';
        switch (stage) {
            case 'slaughter_stage':
                timeField = 'slaughter_time';
                break;
            case 'butcher_stage':
                timeField = 'butcher_time';
                break;
            case 'delivery_stage':
                timeField = 'delivery_time';
                break;
            default:
                return NextResponse.json(
                    { error: "Geçersiz aşama" },
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

        // DB TIMESTAMPTZ: UTC ile sakla
        const completedTime = is_completed ? new Date().toISOString() : null;
        const now = new Date().toISOString();

        const patch: Record<string, unknown> = {
            last_edited_by: actor,
            last_edited_time: now,
            [timeField]: completedTime,
        };

        const { data, error } = await supabaseAdmin.rpc('rpc_update_sacrifice_core', {
            p_actor: actor,
            p_tenant_id: tenantId,
            p_sacrifice_id: sacrifice_id,
            p_sacrifice_year: sacrificeYear,
            p_patch: patch,
        });

        if (error) {
            console.error('rpc_update_sacrifice_core (timing)', error);
            return NextResponse.json(
                { error: "Aşama zamanı güncellenemedi" },
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

        const list = data as Record<string, unknown>[] | null;
        if (!list || list.length === 0) {
            return NextResponse.json(
                { error: "Kurban kaydı bulunamadı" },
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

        // Return the updated data (önceki API tek satır yerine dizi dönüyordu — uyum için dizi)
        return NextResponse.json(list, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch {
            return NextResponse.json(
            { error: "Beklenmeyen bir sunucu hatası oluştu" },
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