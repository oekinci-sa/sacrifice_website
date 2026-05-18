import { authOptions } from '@/lib/auth';
import {
    getSessionActorEmail,
    TAKIP_EKRANI_ACTOR,
} from '@/lib/admin-editor-session';
import { getDefaultSacrificeYear } from '@/lib/constants/sacrifice-year';
import { getTenantId } from '@/lib/tenant';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { handleAutoSms, type StageType } from '@/lib/sms-auto-sender';
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
        const { sacrifice_no, stage, is_completed } = body;

        if (!sacrifice_no || !stage) {
            return NextResponse.json(
                { error: "sacrifice_no ve stage gerekli" },
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

        const sacrificeNoInt = parseInt(String(sacrifice_no), 10);
        if (isNaN(sacrificeNoInt) || sacrificeNoInt <= 0) {
            return NextResponse.json(
                { error: "sacrifice_no geçersiz" },
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

        // sacrifice_no → sacrifice_id (UUID) çözümle
        const { data: animalRow, error: resolveError } = await supabaseAdmin
            .from("sacrifice_animals")
            .select("sacrifice_id")
            .eq("tenant_id", tenantId)
            .eq("sacrifice_no", sacrificeNoInt)
            .eq("sacrifice_year", sacrificeYear)
            .single();

        if (resolveError || !animalRow) {
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

        const sacrifice_id: string = animalRow.sacrifice_id;

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

        // Başarılı güncelleme sonrası otomatik SMS — hata response'u bloklamaz
        if (is_completed) {
            handleAutoSms({
                tenantId,
                sacrificeYear,
                sacrificeNo: sacrificeNoInt,
                stage: stage as StageType,
                isCompleted: true,
            }).catch((err: unknown) => console.error('[auto-sms]', err));
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