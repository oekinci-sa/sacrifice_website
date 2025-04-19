import { authOptions } from "@/lib/auth";
import { supabase } from "@/utils/supabaseClient";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

interface RouteParams {
  params: { id: string };
}

// PATCH /api/users/[id]/status - Update user status
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    // Check authorization
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { status } = await request.json();

    if (!status || !["pending", "approved", "blacklisted"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const { data, error: _error } = await supabase
      .from("users")
      .update({ status })
      .eq("id", id)
      .select();

    if (_error) {
      return NextResponse.json({ error: _error.message }, { status: 500 });
    }

    return NextResponse.json(data[0]);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 