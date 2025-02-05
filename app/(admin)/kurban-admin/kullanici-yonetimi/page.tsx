"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor" | null;
  status: "pending" | "approved" | "blacklisted";
  created_at: string;
  image: string | null;
  updated_at: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching users:", error);
        return;
      }

      setUsers(data || []);
    };

    fetchUsers();

    // Set up real-time subscription
    const channel = supabase
      .channel("users-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "users",
        },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Don't show current user in the list
  const filteredUsers = users.filter(user => user.email !== session?.user?.email);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Kullanıcı Yönetimi</h2>
          <p className="text-muted-foreground">
            Sistem kullanıcılarını yönetin ve erişim izinlerini düzenleyin
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => router.push("/kurban-admin/kullanici-yonetimi/yeni")}>
            <Plus className="mr-2 h-4 w-4" /> Yeni Kullanıcı
          </Button>
        </div>
      </div>
      <DataTable data={filteredUsers} columns={columns} />
    </div>
  );
} 