import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// GET /api/users - Get all users
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        // Check authorization
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabaseAdmin
            .from("users")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Kullanıcıları getirme hatası:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log(`${data.length} kullanıcı başarıyla getirildi`);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Kullanıcıları getirme sırasında bilinmeyen hata:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/users - Create a new user
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Check authorization (only admin can create users)
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const json = await request.json();
        console.log("Yeni kullanıcı oluşturma verileri:", json);

        const { data, error } = await supabaseAdmin
            .from("users")
            .insert(json)
            .select()
            .single();

        if (error) {
            console.error("Kullanıcı oluşturma hatası:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log("Yeni kullanıcı başarıyla oluşturuldu:", data);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Kullanıcı oluşturma sırasında bilinmeyen hata:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 