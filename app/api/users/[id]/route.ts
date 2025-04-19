import { authOptions } from "@/lib/auth";
import { supabase } from "@/utils/supabaseClient";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

interface RouteParams {
    params: { id: string };
}

// GET /api/users/[id] - Get user by ID
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);

        // Check authorization
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;

        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT /api/users/[id] - Update user
export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);

        // Check authorization
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // For non-admin users, they can only update their own profile
        if (session.user.role !== "admin" && session.user.id !== params.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = params;
        const userData = await request.json();

        // If not admin, remove role from the update data
        if (session.user.role !== "admin" && userData.role) {
            delete userData.role;
        }

        const { data, error } = await supabase
            .from("users")
            .update(userData)
            .eq("id", id)
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data[0]);
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);

        // Check authorization
        if (!session || !session.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;

        const { error } = await supabase
            .from("users")
            .delete()
            .eq("id", id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 