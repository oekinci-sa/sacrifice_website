import { authOptions } from "@/lib/auth";
import { getSessionActorEmail } from "@/lib/admin-editor-session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getTenantId } from "@/lib/tenant";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/users - Sadece mevcut tenant'a erişimi olan kullanıcıları getir
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        // Check authorization
        if (!session || !session.user) {
            return NextResponse.json({ error: "Yetkisiz" }, {
                status: 401,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
        }

        const tenantId = getTenantId();

        // user_tenants üzerinden bu tenant'a erişimi olan kullanıcıları getir
        const { data: userTenants, error: utError } = await supabaseAdmin
            .from("user_tenants")
            .select("user_id, approved_at")
            .eq("tenant_id", tenantId);

        if (utError) {
            console.error("user_tenants getirme hatası:", utError);
            return NextResponse.json({ error: utError.message }, { status: 500 });
        }

        const userIds = (userTenants ?? []).map((ut) => ut.user_id);
        if (userIds.length === 0) {
            return NextResponse.json([], {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
        }

        const { data: usersData, error } = await supabaseAdmin
            .from("users")
            .select("*")
            .in("id", userIds)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Kullanıcıları getirme hatası:", error);
            return NextResponse.json({ error: error.message }, {
                status: 500,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
        }

        const utMap = new Map(
            (userTenants ?? []).map((ut: { user_id: string; approved_at: string | null }) => [
                ut.user_id,
                ut.approved_at,
            ])
        );
        const data = (usersData ?? []).map((u) => ({
            ...u,
            tenant_approved_at: utMap.get(u.id) ?? null,
        }));

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (error) {
        console.error("Kullanıcıları getirme sırasında bilinmeyen hata:", error);
        return NextResponse.json(
            { error: "Sunucu hatası" },
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

// POST /api/users - Create a new user
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Check authorization (only admin can create users)
        if (!session?.user || (session.user.role !== "admin" && session.user.role !== "super_admin")) {
            return NextResponse.json({ error: "Yetkisiz" }, {
                status: 401,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
        }

        const json = await request.json();
        const tenantId = getTenantId();

        const actor = getSessionActorEmail(session);
        if (!actor) {
            return NextResponse.json(
                { error: "Oturumda e-posta bulunamadı." },
                { status: 400, headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache', Expires: '0' } }
            );
        }

        // Sadece super_admin yeni kullanıcıya super_admin rolü verebilir
        if (json.role === "super_admin" && session.user.role !== "super_admin") {
            return NextResponse.json(
                { error: "Sadece Super Yönetici bu rolü atayabilir" },
                { status: 403 }
            );
        }

        const payload = {
            email: json.email,
            name: json.name ?? null,
            image: json.image ?? null,
            role: json.role ?? null,
            status: json.status ?? null,
        };

        const { data: rows, error } = await supabaseAdmin.rpc("rpc_create_user", {
            p_actor: actor,
            p_tenant_id: tenantId,
            p_user: payload as unknown as Record<string, unknown>,
        });

        if (error) {
            console.error("rpc_create_user", error);
            return NextResponse.json({ error: error.message || "Kullanıcı oluşturulamadı" }, {
                status: 500,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
        }

        const list = rows as Record<string, unknown>[] | null;
        const data = list?.[0];
        if (!data) {
            return NextResponse.json({ error: "Kullanıcı oluşturulamadı" }, { status: 500, headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache', Expires: '0' } });
        }

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (error) {
        console.error("Kullanıcı oluşturma sırasında bilinmeyen hata:", error);
        return NextResponse.json(
            { error: "Sunucu hatası" },
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