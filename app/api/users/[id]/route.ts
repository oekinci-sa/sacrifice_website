import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

interface RouteParams {
    params: { id: string };
}

// GET /api/users/[id] - Get a user by ID
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check authorization
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = params.id;
        console.log(`Kullanıcı bilgisi getiriliyor: id=${userId}`);

        const { data, error } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("id", userId)
            .single();

        if (error) {
            console.error(`Kullanıcı bilgisi getirme hatası: id=${userId}`, error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data) {
            console.log(`Kullanıcı bulunamadı: id=${userId}`);
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        console.log(`Kullanıcı bilgisi başarıyla getirildi: id=${userId}`);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Kullanıcı bilgisi getirme sırasında bilinmeyen hata:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
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
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = params.id;
        const isAdmin = session.user.role === "admin";
        const isSameUser = session.user.id === userId;

        if (!isAdmin && !isSameUser) {
            console.log(`Yetkisiz kullanıcı güncelleme denemesi: id=${userId}, requester=${session.user.id}`);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let json = await request.json();
        console.log(`Kullanıcı güncelleme verileri: id=${userId}`, json);

        // If not admin, they cannot update role
        if (!isAdmin && json.role) {
            delete json.role;
            console.log("Admin olmayan kullanıcı rol güncelleyemez, rol bilgisi kaldırıldı");
        }

        const { data, error } = await supabaseAdmin
            .from("users")
            .update(json)
            .eq("id", userId)
            .select()
            .single();

        if (error) {
            console.error(`Kullanıcı güncelleme hatası: id=${userId}`, error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log(`Kullanıcı başarıyla güncellendi: id=${userId}`);
        return NextResponse.json(data);
    } catch (error) {
        console.error(`Kullanıcı güncelleme sırasında bilinmeyen hata: id=${params.id}`, error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
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
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = params.id;
        console.log(`Kullanıcı silme işlemi: id=${userId}`);

        const { error } = await supabaseAdmin
            .from("users")
            .delete()
            .eq("id", userId);

        if (error) {
            console.error(`Kullanıcı silme hatası: id=${userId}`, error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log(`Kullanıcı başarıyla silindi: id=${userId}`);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(`Kullanıcı silme sırasında bilinmeyen hata: id=${params.id}`, error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 