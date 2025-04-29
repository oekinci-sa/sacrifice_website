import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/users/[id] - Get a user by ID
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check authorization
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, {
                status: 401,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
        }

        const userId = params.id;

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
            return NextResponse.json({ error: "User not found" }, {
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
            { error: "Internal server error" },
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
            return NextResponse.json({ error: "Unauthorized" }, {
                status: 401,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
        }

        const userId = params.id;
        const isAdmin = session.user.role === "admin";
        const isSameUser = session.user.id === userId;

        if (!isAdmin && !isSameUser) {
            return NextResponse.json({ error: "Unauthorized" }, {
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
        if (!isAdmin && json.role) {
            delete json.role;
        }

        const { data, error } = await supabaseAdmin
            .from("users")
            .update(json)
            .eq("id", userId)
            .select()
            .single();

        if (error) {
            console.error(`Kullanıcı güncelleme hatası: id=${userId}`, error);
            return NextResponse.json({ error: error.message }, {
                status: 500,
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
        console.error(`Kullanıcı güncelleme sırasında bilinmeyen hata: id=${params.id}`, error);
        return NextResponse.json(
            { error: "Internal server error" },
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
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, {
                status: 401,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
        }

        const userId = params.id;

        const { error } = await supabaseAdmin
            .from("users")
            .delete()
            .eq("id", userId);

        if (error) {
            console.error(`Kullanıcı silme hatası: id=${userId}`, error);
            return NextResponse.json({ error: error.message }, {
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
            { error: "Internal server error" },
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