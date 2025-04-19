import { authOptions } from "@/lib/auth";
import { supabase } from "@/utils/supabaseClient";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// POST /api/users/upload-image - Upload a profile image
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Check authorization
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const userId = formData.get("userId") as string;

        // Verify the user has permission to upload for this user ID
        if (session.user.role !== "admin" && session.user.id !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (!file) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}.${fileExt}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(fileName, buffer, { upsert: true });

        if (uploadError) {
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);

        return NextResponse.json({ url: data.publicUrl });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 