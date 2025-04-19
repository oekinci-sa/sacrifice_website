import { authOptions } from "@/lib/auth";
import { supabase } from "@/utils/supabaseClient";
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

        const { data, error } = await supabase
            .from("users")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
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

        // Check authorization
        if (!session || !session.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userData = await request.json();

        const { data, error } = await supabase
            .from("users")
            .insert([userData])
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data[0], { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 