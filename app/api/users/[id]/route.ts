import { authOptions } from "@/lib/auth";
import { getSessionActorEmail } from "@/lib/admin-editor-session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getTenantId } from "@/lib/tenant";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function userBelongsToTenant(userId: string, tenantId: string): Promise<boolean> {
    const { data } = await supabaseAdmin
        .from("user_tenants")
        .select("user_id")
        .eq("user_id", userId)
        .eq("tenant_id", tenantId)
        .single();
    return !!data;
}

// GET /api/users/[id] - Get a user by ID (sadece tenant'ta erişimi varsa)
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
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

        const userId = params.id;
        const tenantId = getTenantId();

        const belongsToTenant = await userBelongsToTenant(userId, tenantId);
        if (!belongsToTenant) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
        }

        const { data, error } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("id", userId)
            .single();

        if (error) {
            console.error(`Kullanıcı bilgisi getirme hatası: id=${userId}`, error);
            return NextResponse.json({ error: error.message }, {
                status: 500,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
        }

        if (!data) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı" }, {
                status: 404,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
        }

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (error) {
        console.error("Kullanıcı bilgisi getirme sırasında bilinmeyen hata:", error);
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

// PUT /api/users/[id] - Update a user
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check authorization (admin or the user themselves)
        if (!session?.user) {
            return NextResponse.json({ error: "Yetkisiz" }, {
                status: 401,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
        }

        const userId = params.id;
        const tenantId = getTenantId();
        const isAdmin = session.user.role === "admin" || session.user.role === "super_admin";
        const isSameUser = session.user.id === userId;

        const belongsToTenant = await userBelongsToTenant(userId, tenantId);
        if (!belongsToTenant) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
        }

        if (!isAdmin && !isSameUser) {
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

        // If not admin, they cannot update role
        if (!isAdmin && "role" in json) {
            delete json.role;
        }

        // Sadece super_admin başka kullanıcıya super_admin rolü verebilir
        if (json.role === "super_admin" && session.user.role !== "super_admin") {
            return NextResponse.json(
                { error: "Sadece Super Yönetici bu rolü atayabilir" },
                { status: 403 }
            );
        }

        const actor = getSessionActorEmail(session);
        if (!actor) {
            return NextResponse.json(
                { error: "Oturumda e-posta bulunamadı." },
                { status: 400, headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache', Expires: '0' } }
            );
        }

        const patch: Record<string, unknown> = {};
        if (json.name !== undefined) patch.name = json.name;
        if (json.image !== undefined) patch.image = json.image;
        if (json.role !== undefined) patch.role = json.role;
        if (json.email !== undefined) patch.email = json.email;

        const { data: rows, error } = await supabaseAdmin.rpc("rpc_update_user", {
            p_actor: actor,
            p_tenant_id: tenantId,
            p_user_id: userId,
            p_patch: patch,
        });

        if (error) {
            console.error(`rpc_update_user id=${userId}`, error);
            return NextResponse.json({ error: "Kullanıcı güncellenemedi" }, {
                status: 500,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
        }

        const list = rows as Record<string, unknown>[] | null;
        if (!list || list.length === 0) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404, headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache', Expires: '0' } });
        }

        const data = list[0];

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (error) {
        console.error(`Kullanıcı güncelleme sırasında bilinmeyen hata: id=${params.id}`, error);
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

// DELETE /api/users/[id] - Delete a user
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check authorization (admin only)
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

        const userId = params.id;
        const tenantId = getTenantId();

        const belongsToTenant = await userBelongsToTenant(userId, tenantId);
        if (!belongsToTenant) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
        }

        const actor = getSessionActorEmail(session);
        if (!actor) {
            return NextResponse.json(
                { error: "Oturumda e-posta bulunamadı." },
                { status: 400, headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache', Expires: '0' } }
            );
        }

        const { error } = await supabaseAdmin.rpc("rpc_delete_user", {
            p_actor: actor,
            p_tenant_id: tenantId,
            p_user_id: userId,
        });

        if (error) {
            console.error(`rpc_delete_user id=${userId}`, error);
            const msg = error.message ?? "";
            if (msg.includes("user_not_found")) {
                return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404, headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache', Expires: '0' } });
            }
            return NextResponse.json({ error: "Kullanıcı silinemedi" }, {
                status: 500,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
        }

        return NextResponse.json({ success: true }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (error) {
        console.error(`Kullanıcı silme sırasında bilinmeyen hata: id=${params.id}`, error);
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